'use strict';

var axios = require('axios');

var DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
var CACHE_MAX = 500;

var translationCache = new Map();

function cacheSet(key, value) {
  if (translationCache.size >= CACHE_MAX) {
    var firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

async function detectAndTranslate(text) {
  var cacheKey = text.substring(0, 100);

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  var apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.warn('[translation] DEEPL_API_KEY is not set; returning original text.');
    return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
  }

  try {
    var response = await axios.post(
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

    var translations = response.data.translations;
    if (!translations || translations.length === 0) {
      console.warn('[translation] DeepL returned empty translations array.');
      return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
    }

    var detectedLang = translations[0].detected_source_language;
    var translatedText = translations[0].text;

    var result;
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
    if (err.response && err.response.status === 456) {
      console.warn('[translation] DeepL quota exceeded (HTTP 456); returning original text.');
      return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
    }
    console.error('[translation] detectAndTranslate error:', err.message);
    return { original: text, translated: text, detectedLang: 'UNK', targetLang: 'EN' };
  }
}

async function translateTo(text, targetLang) {
  var cacheKey = text.substring(0, 100) + ':' + targetLang;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  var apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return { translated: text, targetLang: targetLang };
  }

  try {
    var response = await axios.post(
      DEEPL_API_URL,
      new URLSearchParams({
        auth_key: apiKey,
        text: text,
        target_lang: targetLang
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000
      }
    );

    var translations = response.data.translations;
    if (!translations || translations.length === 0) {
      return { translated: text, targetLang: targetLang };
    }

    var result = { translated: translations[0].text, targetLang: targetLang };
    cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    if (err.response && err.response.status === 456) {
      console.warn('[translation] DeepL quota exceeded; returning original.');
      return { translated: text, targetLang: targetLang };
    }
    console.error('[translation] translateTo error:', err.message);
    return { translated: text, targetLang: targetLang };
  }
}

module.exports = {
  detectAndTranslate: detectAndTranslate,
  translateTo: translateTo
};
