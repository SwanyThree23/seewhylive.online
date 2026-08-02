'use strict';

var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');
var { v4: uuidv4 } = require('uuid');

class SwanyBot extends EventEmitter {
  constructor(io) {
    super();

    this.io = io;

    this.rules = {
      viewer_join: true,
      gift_received: true,
      spam_detected: true,
      viewers_drop_20pct: true,
      new_subscription: true
    };

    this.chatRateMap = new Map();
    this.mutedSockets = new Map();
    this.commandCooldown = new Map(); // userId/socketId → last command timestamp
    this.lastViewerCount = 0;
    this.logPath = '/var/log/seewhy/swanybot.log';

    // Engagement surge: roomId → [{count, ts}] (last 5 minutes of samples)
    this.viewerHistory = new Map();
    // Gift race tracking: roomId → Map<username, centsTotal>
    this.giftTotals = new Map();
    // Cooldown for race alerts: roomId → lastAlertTs
    this.lastRaceAlert = new Map();
    // Retention coach: roomId → timeout handle
    this.retentionTimeouts = new Map();

    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    } catch (mkdirErr) {
      console.warn('[SwanyBot] Could not create log directory:', mkdirErr.message);
      this.logPath = path.join(require('os').tmpdir(), 'swanybot.log');
    }

    this.aura = require('./aura');
  }

  log(level, event, message, roomId) {
    var entry =
      JSON.stringify({
        ts: new Date().toISOString(),
        level: level,
        event: event,
        message: message
      }) + '\n';

    fs.appendFile(this.logPath, entry, function(err) {
      if (err) {
        console.error('[SwanyBot] Log write failed:', err.message);
      }
    });

    if (roomId) {
      this.io.to(roomId).emit('bot-log', {
        level: level,
        event: event,
        message: message,
        ts: Date.now()
      });
    }
  }

  onViewerJoin(roomId, username, socketId) {
    if (!this.rules.viewer_join) return;

    var self = this;

    this.aura.queueMessage('greeting', { username: username }, function(text) {
      self.io.to(roomId).emit('chat-message', {
        id: uuidv4(),
        username: 'AURA',
        message: text,
        ts: Date.now(),
        isBot: true
      });
      self.log('info', 'viewer_join', 'AURA greeted ' + username, null);
    });

    this.io.to(roomId).emit('bot-log', {
      event: 'viewer_join',
      message: username + ' joined',
      ts: Date.now()
    });
  }

  onGiftReceived(roomId, from, giftName, giftValue) {
    if (!this.rules.gift_received) return;

    var self = this;

    this.aura.queueMessage(
      'hype',
      { giftName: giftName, giftValue: giftValue, username: from },
      function(text) {
        self.io.to(roomId).emit('chat-message', {
          id: uuidv4(),
          username: 'AURA',
          message: text,
          ts: Date.now(),
          isBot: true
        });
      }
    );

    this.log(
      'info',
      'gift_received',
      from + ' sent ' + giftName + ' worth ' + giftValue + ' cents',
      null
    );

    this.io.to(roomId).emit('bot-log', {
      event: 'gift_received',
      message: from + ' sent ' + giftName,
      ts: Date.now()
    });

    // Track running gift totals for race detection
    if (!this.giftTotals.has(roomId)) {
      this.giftTotals.set(roomId, new Map());
    }
    var roomTotals = this.giftTotals.get(roomId);
    roomTotals.set(from, (roomTotals.get(from) || 0) + Math.floor(giftValue));
    this._checkGiftRace(roomId);
  }

  _checkGiftRace(roomId) {
    var roomTotals = this.giftTotals.get(roomId);
    if (!roomTotals || roomTotals.size < 2) return;

    // Cooldown: fire at most once per 60 seconds per room
    var now = Date.now();
    if (now - (this.lastRaceAlert.get(roomId) || 0) < 60000) return;

    var sorted = [];
    roomTotals.forEach(function(cents, username) {
      sorted.push({ username: username, cents: cents });
    });
    sorted.sort(function(a, b) { return b.cents - a.cents; });

    if (sorted.length < 2) return;

    var leader = sorted[0];
    var chaser = sorted[1];
    if (leader.cents <= 0 || chaser.cents < 100) return;

    var gap    = leader.cents - chaser.cents;
    var gapPct = (gap / leader.cents) * 100;

    if (gapPct <= 15) {
      this.lastRaceAlert.set(roomId, now);
      var gapDollars = (Math.floor(gap) / 100).toFixed(2);
      this.io.to(roomId).emit('chat-message', {
        id:       uuidv4(),
        username: 'SWANYBOT',
        message:  '🏁 GIFT RACE! ' + leader.username + ' leads ' + chaser.username + ' by just $' + gapDollars + ' — who takes the crown? 👑',
        ts:       now,
        isBot:    true
      });
      this.io.to(roomId).emit('bot-log', {
        event:   'trigger',
        message: 'Gift race: ' + leader.username + ' vs ' + chaser.username + ' (gap $' + gapDollars + ')',
        ts:      now
      });
    }
  }

  resetRoomGifts(roomId) {
    this.giftTotals.delete(roomId);
    this.lastRaceAlert.delete(roomId);
    this.viewerHistory.delete(roomId);
  }

  cleanupRoom(roomId) {
    this.resetRoomGifts(roomId);
    // Prune commandCooldown entries — these are keyed by userId/socketId, not roomId,
    // so we can only age them out rather than delete by room.
    var cutoff = Date.now() - 30000;
    this.commandCooldown.forEach(function(ts, key) {
      if (ts < cutoff) this.commandCooldown.delete(key);
    }, this);
  }

  onChatMessage(roomId, socketId, message, context) {
    var now = Date.now();

    // Handle ! commands before rate-limit; commands don't count as spam
    if (message && message.charAt(0) === '!') {
      this._handleCommand(roomId, socketId, message, context || {});
      return false;
    }

    if (!this.chatRateMap.has(socketId)) {
      this.chatRateMap.set(socketId, { count: 1, windowStart: now });
      return false;
    }

    var entry = this.chatRateMap.get(socketId);

    if (now - entry.windowStart > 10000) {
      entry.count = 1;
      entry.windowStart = now;
      return false;
    }

    entry.count += 1;

    if (entry.count > 5 && this.rules.spam_detected) {
      this.mutedSockets.set(socketId, now + 60000);

      this.io.to(roomId).emit('bot-log', {
        event: 'spam_detected',
        message: 'User muted for 60s',
        ts: now
      });

      this.log('warn', 'spam_detected', 'Socket ' + socketId + ' muted for 60s', null);
      return true;
    }

    return false;
  }

  _handleCommand(roomId, socketId, message, context) {
    var self  = this;
    var parts = message.slice(1).trim().split(/\s+/);
    var cmd   = parts[0].toLowerCase();
    var room  = context.room || null;

    // Per-user command cooldown (5 s) — prevents flooding LLM/API calls via !hype etc.
    var _cmdKey = (context && context.userId) || socketId;
    var _cmdNow = Date.now();
    if (_cmdNow - (this.commandCooldown.get(_cmdKey) || 0) < 5000) return;
    this.commandCooldown.set(_cmdKey, _cmdNow);

    function botSay(text) {
      self.io.to(roomId).emit('chat-message', {
        id:       uuidv4(),
        username: 'SWANYBOT',
        message:  text,
        ts:       Date.now(),
        isBot:    true
      });
    }

    if (cmd === 'hype') {
      self.aura.queueMessage('hype', { username: context.username || 'the crowd' }, function(text) {
        self.io.to(roomId).emit('chat-message', {
          id:       uuidv4(),
          username: 'AURA',
          message:  text,
          ts:       Date.now(),
          isBot:    true
        });
      });
      self.log('info', 'command', '!hype triggered by ' + (context.username || socketId), null);
      return;
    }

    if (cmd === 'info') {
      var title    = (room && room.streamTitle)    ? room.streamTitle    : 'SeeWhy LIVE';
      var category = (room && room.streamCategory) ? room.streamCategory : 'Live';
      var durMins  = 0;
      if (room && room.liveStartedAt) {
        durMins = Math.floor((Date.now() / 1000 - room.liveStartedAt) / 60);
      }
      botSay('📡 ' + title + ' · ' + category + ' · ' + durMins + 'm on air');
      return;
    }

    if (cmd === 'score' || cmd === 'viewers') {
      var viewers = (room && room.viewers) ? room.viewers.size : 0;
      botSay('👁 ' + viewers + ' watching right now — stay locked in!');
      return;
    }

    if (cmd === 'poll') {
      var pollRaw   = message.slice(1 + cmd.length).trim();
      var pollArgs  = [];
      var pollRegex = /"([^"]+)"/g;
      var pollMatch;
      while ((pollMatch = pollRegex.exec(pollRaw)) !== null) {
        pollArgs.push(pollMatch[1]);
      }
      if (pollArgs.length < 3) {
        botSay('📊 Usage: !poll "Question" "Option A" "Option B" [up to 4 options]');
        return;
      }
      self.emit('poll-request', roomId, { question: pollArgs[0], options: pollArgs.slice(1, 5) });
      self.log('info', 'command', '!poll by ' + (context.username || socketId), null);
      return;
    }

    if (cmd === 'endpoll') {
      self.emit('poll-end-request', roomId);
      self.log('info', 'command', '!endpoll by ' + (context.username || socketId), null);
      return;
    }

    if (cmd === 'vote') {
      var voteIdx = parseInt(parts[1], 10) - 1;
      if (!isNaN(voteIdx) && voteIdx >= 0) {
        self.emit('poll-vote-cmd', roomId, socketId, voteIdx);
      }
      return;
    }

    if (cmd === 'commands' || cmd === 'help') {
      botSay('🤖 Commands: !hype · !info · !score · !poll "Q" "A" "B" · !vote 1 · !endpoll · !commands');
      return;
    }

    // Unknown command — silently ignore to avoid polluting chat
  }

  isSocketMuted(socketId) {
    if (!this.mutedSockets.has(socketId)) return false;

    var expiresAt = this.mutedSockets.get(socketId);
    if (Date.now() > expiresAt) {
      this.mutedSockets.delete(socketId);
      return false;
    }

    return true;
  }

  onViewerCountChange(roomId, newCount) {
    // Track viewer history for surge detection (keep last 5 minutes)
    var now = Date.now();
    if (!this.viewerHistory.has(roomId)) this.viewerHistory.set(roomId, []);
    var history = this.viewerHistory.get(roomId);
    history.push({ count: newCount, ts: now });
    var cutoff = now - 5 * 60 * 1000;
    while (history.length > 0 && history[0].ts < cutoff) history.shift();

    // Engagement surge: 25%+ jump in 60 seconds, minimum 5 viewers
    if (newCount >= 5) {
      var sixtyAgo = now - 60000;
      var baseline = null;
      for (var i = 0; i < history.length; i++) {
        if (history[i].ts <= sixtyAgo) { baseline = history[i]; break; }
      }
      if (baseline && baseline.count > 0) {
        var growthPct = Math.floor(((newCount - baseline.count) / baseline.count) * 100);
        if (growthPct >= 25) {
          this._onEngagementSurge(roomId, growthPct, newCount);
        }
      }
    }

    if (!this.rules.viewers_drop_20pct) {
      this.lastViewerCount = newCount;
      return;
    }

    if (newCount < this.lastViewerCount * 0.80 && this.lastViewerCount > 10) {
      this.io.to(roomId).emit('host-alert', {
        type: 'viewers_drop',
        message: 'Viewer count dropped 20%+',
        previous: this.lastViewerCount,
        current: newCount,
        ts: Date.now()
      });
      this.log(
        'warn',
        'viewers_drop_20pct',
        'Count dropped from ' + this.lastViewerCount + ' to ' + newCount,
        null
      );
    }

    if (newCount >= 1000 && this.lastViewerCount < 1000) {
      this.io.to(roomId).emit('bot-log', {
        event: 'milestone_1000',
        message: '1000 viewers! Consider initiating FADES!',
        ts: Date.now()
      });
    }

    this.lastViewerCount = newCount;
  }

  _onEngagementSurge(roomId, pct, currentViewers) {
    var self = this;
    this.io.to(roomId).emit('host-alert', {
      type:    'engagement_surge',
      message: 'SURGE! Viewers up ' + pct + '% in 60s (' + currentViewers + ' watching) — momentum building!',
      pct:     pct,
      viewers: currentViewers,
      ts:      Date.now()
    });
    this.aura.queueMessage('hype', { username: 'the growing crowd' }, function(text) {
      self.io.to(roomId).emit('chat-message', {
        id:       uuidv4(),
        username: 'AURA',
        message:  text,
        ts:       Date.now(),
        isBot:    true
      });
    });
    this.io.to(roomId).emit('bot-log', {
      event:   'engagement_surge',
      message: 'Viewer surge +' + pct + '% to ' + currentViewers,
      ts:      Date.now()
    });
    this.log('info', 'engagement_surge', 'Surge +' + pct + '% to ' + currentViewers + ' in ' + roomId, null);
  }

  onNewSubscription(roomId, username, tier) {
    if (!this.rules.new_subscription) return;

    var self = this;

    this.aura.queueMessage('shoutout', { username: username, tier: tier }, function(text) {
      self.io.to(roomId).emit('chat-message', {
        id: uuidv4(),
        username: 'AURA',
        message: text,
        ts: Date.now(),
        isBot: true
      });
    });

    this.log(
      'info',
      'new_subscription',
      username + ' subscribed at ' + tier + ' tier',
      null
    );
  }

  onRevenueMilestone(roomId, totalCents) {
    var dollars = Math.floor(totalCents / 100);
    var now     = Date.now();

    this.io.to(roomId).emit('chat-message', {
      id:       uuidv4(),
      username: 'SWANYBOT',
      message:  '💰 MILESTONE! This stream just hit $' + dollars + ' in revenue — creators keep 90%! 🏆',
      ts:       now,
      isBot:    true
    });

    this.io.to(roomId).emit('host-alert', {
      type:    'revenue_milestone',
      message: '💰 $' + dollars + ' session milestone hit!',
      cents:   totalCents,
      ts:      now
    });

    this.io.to(roomId).emit('bot-log', {
      event:   'milestone_revenue',
      message: 'Session revenue hit $' + dollars,
      ts:      now
    });

    this.log('info', 'revenue_milestone', 'Session revenue hit $' + dollars, null);
  }

  onStreamStart(roomId) {
    var self = this;
    // Clear any existing retention timeout for this room
    var existing = this.retentionTimeouts.get(roomId);
    if (existing) clearTimeout(existing);

    // After 15 minutes, check if viewer count is still low and nudge the host
    var t = setTimeout(function() {
      self.retentionTimeouts.delete(roomId);
      var history     = self.viewerHistory.get(roomId);
      var latestCount = (history && history.length > 0) ? history[history.length - 1].count : 0;
      if (latestCount < 5) {
        self.io.to(roomId).emit('host-alert', {
          type:    'retention_coach',
          message: '💡 15 min in with a small crowd — try: share to socials, run a poll (!poll in chat), call out viewers by name, or tease a giveaway!',
          ts:      Date.now()
        });
        self.io.to(roomId).emit('bot-log', {
          event:   'retention_coach',
          message: 'Retention tip sent (< 5 viewers at 15min)',
          ts:      Date.now()
        });
      }
    }, 15 * 60 * 1000);

    this.retentionTimeouts.set(roomId, t);
    this.log('info', 'stream_start', 'Retention coach armed for ' + roomId, null);
  }

  onStreamEnd(roomId) {
    var t = this.retentionTimeouts.get(roomId);
    if (t) { clearTimeout(t); this.retentionTimeouts.delete(roomId); }
  }

  onWelcomeVisitor(socketId) {
    this.io.to(socketId).emit('welcome-audio', { ts: Date.now() });
  }

  toggleRule(ruleName, enabled) {
    if (Object.prototype.hasOwnProperty.call(this.rules, ruleName)) {
      this.rules[ruleName] = enabled;
    } else {
      console.warn('[SwanyBot] toggleRule: unknown rule "' + ruleName + '"');
    }
  }
}

module.exports = SwanyBot;
