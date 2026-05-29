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
    this.lastViewerCount = 0;
    this.logPath = '/var/log/seewhy/swanybot.log';

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

    if (cmd === 'commands' || cmd === 'help') {
      botSay('🤖 Commands: !hype · !info · !score · !commands');
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

    this.io.to(roomId).emit('chat-message', {
      id: uuidv4(),
      username: 'AURA',
      message: '🔥 SeeWhy LIVE just hit $' + dollars + ' in revenue this session!',
      ts: Date.now(),
      isBot: true
    });

    this.log(
      'info',
      'revenue_milestone',
      'Session revenue hit $' + dollars,
      null
    );
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
