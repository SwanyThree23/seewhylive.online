'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ---------------------------------------------------------------------------
// SwanyBot – event-driven automation engine for SeeWhy LIVE
// ---------------------------------------------------------------------------

class SwanyBot extends EventEmitter {
  constructor(io) {
    super();

    this.io = io;

    // Feature flags – all on by default
    this.rules = {
      viewer_join: true,
      gift_received: true,
      spam_detected: true,
      viewers_drop_20pct: true,
      new_subscription: true
    };

    // Spam detection: socketId → { count: number, windowStart: number }
    this.chatRateMap = new Map();

    // Mute tracking: socketId → muteExpiresAt (epoch ms)
    this.mutedSockets = new Map();

    // Viewer-count state for drop-detection
    this.lastViewerCount = 0;

    // Log destination
    this.logPath = '/var/log/seewhy/swanybot.log';

    // Ensure the log directory exists
    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    } catch (mkdirErr) {
      console.warn('[SwanyBot] Could not create log directory:', mkdirErr.message);
      // Fall back to tmp so logging still works
      this.logPath = path.join(require('os').tmpdir(), 'swanybot.log');
    }

    // AURA integration
    this.aura = require('./aura');
  }

  // -------------------------------------------------------------------------
  // Logging
  // -------------------------------------------------------------------------

  /**
   * Appends a structured log line to this.logPath and emits 'bot-log' to
   * an optional room.
   *
   * @param {'info'|'warn'|'error'} level
   * @param {string} event
   * @param {string} message
   * @param {string} [roomId]  if provided, emits bot-log to that room
   */
  log(level, event, message, roomId) {
    const entry =
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

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  /**
   * Handles a viewer joining a room.
   * Triggers an AURA greeting and emits a bot-log to the room.
   *
   * @param {string} roomId
   * @param {string} username
   * @param {string} socketId
   */
  onViewerJoin(roomId, username, socketId) {
    if (!this.rules.viewer_join) return;

    const self = this;

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

  /**
   * Handles a gift received event.
   * Triggers an AURA hype message and logs the event.
   *
   * @param {string} roomId
   * @param {string} from        gifter's username
   * @param {string} giftName
   * @param {number} giftValue   value in cents
   */
  onGiftReceived(roomId, from, giftName, giftValue) {
    if (!this.rules.gift_received) return;

    const self = this;

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

  /**
   * Processes an incoming chat message for spam detection.
   *
   * @param {string} roomId
   * @param {string} socketId
   * @param {string} message
   * @returns {boolean}  true if the message is spam and should be suppressed
   */
  onChatMessage(roomId, socketId, message) {
    const now = Date.now();

    if (!this.chatRateMap.has(socketId)) {
      this.chatRateMap.set(socketId, { count: 1, windowStart: now });
      return false;
    }

    const entry = this.chatRateMap.get(socketId);

    if (now - entry.windowStart > 10000) {
      // New 10-second window
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

  /**
   * Checks whether a socket is currently muted.
   * Automatically clears expired mutes.
   *
   * @param {string} socketId
   * @returns {boolean}
   */
  isSocketMuted(socketId) {
    if (!this.mutedSockets.has(socketId)) return false;

    const expiresAt = this.mutedSockets.get(socketId);
    if (Date.now() > expiresAt) {
      this.mutedSockets.delete(socketId);
      return false;
    }

    return true;
  }

  /**
   * Tracks viewer-count changes and emits alerts for significant drops
   * or milestone crossings.
   *
   * @param {string} roomId
   * @param {number} newCount
   */
  onViewerCountChange(roomId, newCount) {
    if (!this.rules.viewers_drop_20pct) {
      this.lastViewerCount = newCount;
      return;
    }

    // Drop of 20%+ with a meaningful baseline
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

    // 1 000-viewer milestone
    if (newCount >= 1000 && this.lastViewerCount < 1000) {
      this.io.to(roomId).emit('bot-log', {
        event: 'milestone_1000',
        message: '1000 viewers! Consider initiating FADES!',
        ts: Date.now()
      });
    }

    this.lastViewerCount = newCount;
  }

  /**
   * Handles a new subscription event.
   * Triggers an AURA shoutout message.
   *
   * @param {string} roomId
   * @param {string} username
   * @param {string} tier
   */
  onNewSubscription(roomId, username, tier) {
    if (!this.rules.new_subscription) return;

    const self = this;

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

  /**
   * Announces a revenue milestone in the room chat.
   *
   * @param {string} roomId
   * @param {number} totalCents  cumulative session revenue in cents
   */
  onRevenueMilestone(roomId, totalCents) {
    const dollars = Math.floor(totalCents / 100);

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

  /**
   * Enables or disables a named automation rule.
   *
   * @param {string}  ruleName
   * @param {boolean} enabled
   */
  toggleRule(ruleName, enabled) {
    if (Object.prototype.hasOwnProperty.call(this.rules, ruleName)) {
      this.rules[ruleName] = enabled;
    } else {
      console.warn('[SwanyBot] toggleRule: unknown rule "' + ruleName + '"');
    }
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = SwanyBot;
