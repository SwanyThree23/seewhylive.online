/**
 * wordFilter — shared blocked-word scanner for live chat.
 *
 * A watched word can do one of two things:
 *   action "hide" → the message is hidden from chat entirely
 *   action "flag" → the message stays but is marked for the host
 */

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Scan one chat message against a creator's watched-word list.
 *
 * @param {string} text  message body
 * @param {Array<{word: string, action?: string}>} words  watched words
 * @returns {{ matched: string[], shouldHide: boolean }}
 */
export function scanMessage(text, words) {
  const body = (text || '').toLowerCase();
  const matched = [];
  let shouldHide = false;

  (words || []).forEach((entry) => {
    const word = (entry?.word || '').trim().toLowerCase();
    if (!word) return;
    const hit = new RegExp(`(^|[^a-z0-9])${escapeRegex(word)}([^a-z0-9]|$)`, 'i').test(body);
    if (!hit) return;
    matched.push(entry.word);
    if (entry.action === 'hide') shouldHide = true;
  });

  return { matched, shouldHide };
}