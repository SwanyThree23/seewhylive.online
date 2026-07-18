/**
 * useOpenRouter — thin hook for calling OpenRouter directly from the browser
 * using the key stored via ApiKeyManager (localStorage swl_apikey_openrouter).
 *
 * Falls back to base44.integrations.Core.InvokeLLM when no key is present.
 */
import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL  = 'anthropic/claude-haiku-4-5';

function getKey() {
  try { return localStorage.getItem('swl_apikey_openrouter') || ''; } catch { return ''; }
}

/**
 * Returns { invoke, hasKey }
 *
 * invoke({ prompt, model, systemPrompt, maxTokens, jsonMode })
 *   → Promise<string>  — the assistant's text response
 */
export function useOpenRouter() {
  const hasKey = !!getKey();

  const invoke = useCallback(async ({
    prompt,
    model = DEFAULT_MODEL,
    systemPrompt = 'You are a helpful creative assistant for SeeWhy LIVE.',
    maxTokens = 1024,
    jsonMode = false,
  }) => {
    const key = getKey();

    if (!key) {
      // Fallback to platform LLM
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });
      return typeof res === 'string' ? res : (res?.text || res?.choices?.[0]?.message?.content || JSON.stringify(res));
    }

    const body = {
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt },
      ],
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SeeWhy LIVE',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`OpenRouter ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }, []);

  return { invoke, hasKey };
}
