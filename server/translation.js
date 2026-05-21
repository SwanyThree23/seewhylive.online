'use strict';

const axios = require('axios');

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const CACHE_MAX = 500;

// LRU-style cache backed by a Map (insertion-order preserved)
const translationCache = new Map();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function cacheSet(key, value) {
  // If at capacity, evict the oldest entry (first key in insertion order)
  if (translationCache.size >= CACHE_MAX) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detects the language of `text` and translates it to English using the
 * DeepL free-tier API.  Results are cached (max 500 entries, LRU eviction).
 *
 * @param {string} text
 * @returns {Promise<{original: string, translated: string, detectedLang: string, targetLang: string}>}
 */
async function detectAndTranslate(text) {
  const cacheKey = text.substring(0, 100);

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.warn('[translation] DEEPL_API_KEY is not set; returning original text.');
    return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
  }

  try {
    const response = await axios.post(
      DEEPL_API_URL,
      new URLSearchParams({
        auth_key: apiKey,
        text: text,
        target_lang: 'EN'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000
      }
    );

    const translations = response.data.translations;
    if (!translations || translations.length === 0) {
      console.warn('[translation] DeepL returned empty translations array.');
      return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
    }

    const detectedLang = translations[0].detected_source_language;
    const translatedText = translations[0].text;

    let result;
    if (detectedLang === 'EN') {
      result = { original: text, translated: text, detectedLang: 'EN', targetLang: 'EN' };
    } else {
      result = {
        original: text,
        translated: translatedText,
        detectedLang: detectedLang,
        targetLang: 'EN'
      };
    }

    cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    // Handle DeepL quota exceeded (HTTP 456)
    if (err.response && err.response.status === 456) {
      console.warn('[translation] DeepL quota exceeded (HTTP 456); returning original text.');
      return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
    }

    // Network or other API error
    console.error('[translation] detectAndTranslate error:', err.message);
    return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  detectAndTranslate: detectAndTranslate
};
