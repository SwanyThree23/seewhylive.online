'use strict';

var OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function createClient() {
  return {
    messages: {
      create: function(params) {
        var model = params.model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
        var messages = [];
        if (params.system) {
          messages.push({ role: 'system', content: params.system });
        }
        var userMsgs = params.messages || [];
        for (var i = 0; i < userMsgs.length; i++) {
          var m = userMsgs[i];
          var content = m.content;
          if (Array.isArray(content)) {
            content = content.map(function(c) { return c.text || ''; }).join('\n');
          }
          messages.push({ role: m.role, content: content });
        }
        return fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
            'HTTP-Referer': 'https://seewhylive.online',
            'X-Title': 'SeeWhy LIVE'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: params.max_tokens || 256,
            messages: messages
          })
        }).then(function(res) {
          return res.json();
        }).then(function(data) {
          if (data.error) {
            throw new Error(data.error.message || 'OpenRouter error');
          }
          var text = '';
          if (data.choices && data.choices[0] && data.choices[0].message) {
            text = data.choices[0].message.content || '';
          }
          return { content: [{ text: text }] };
        });
      }
    }
  };
}

function getClient() {
  return createClient();
}

module.exports = { getClient: getClient };
