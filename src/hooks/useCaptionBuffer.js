// Module-level ring buffer — one instance shared across all components in a tab.
// LiveCaptionOverlay pushes new transcript segments here;
// AuraPanel / AuraPanelDrawer read from here when building AI prompts.

var WINDOW_MS = 20000;
var _entries = []; // [{ name, text, ts }]

export function pushCaptionLine(name, text) {
  var now = Date.now();
  _entries.push({ name: name, text: String(text).trim(), ts: now });
  _entries = _entries.filter(function(e) { return now - e.ts < WINDOW_MS; });
}

// Returns a formatted "Name: text\n..." string for the last 20 seconds of captions,
// or an empty string when nothing has been captured.
export function getRecentContext() {
  var now = Date.now();
  var recent = _entries.filter(function(e) { return now - e.ts < WINDOW_MS; });
  if (!recent.length) return '';
  return recent.map(function(e) { return e.name + ': ' + e.text; }).join('\n');
}

export function clearCaptionBuffer() {
  _entries = [];
}
