// frontend/src/services/shareService.js
//
// Strategy: navigator.share() (native OS share sheet) is the primary path —
// on mobile it already lists Instagram, TikTok, Snapchat, Facebook, Messages,
// etc. automatically, because those apps register themselves as OS share
// targets. This is more reliable than trying to hand-build deep links for
// each platform (Instagram/TikTok in particular have no public web intent
// for sharing arbitrary external content without their business SDKs).
//
// Desktop / unsupported browsers fall back to explicit share links for the
// platforms that DO support a public web share intent (Facebook, Twitter/X,
// WhatsApp) plus copy-to-clipboard for everything else.

export function canUseNativeShare() {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * @param {{title: string, text: string, url: string}} payload
 */
export async function nativeShare(payload) {
  if (!canUseNativeShare()) {
    throw new Error('Native share not supported on this device/browser');
  }
  try {
    await navigator.share(payload);
    return { method: 'native', ok: true };
  } catch (err) {
    if (err.name === 'AbortError') return { method: 'native', ok: false, cancelled: true };
    throw err;
  }
}

export async function copyLink(url) {
  await navigator.clipboard.writeText(url);
  return { method: 'clipboard', ok: true };
}

// Desktop fallback links — these are the only platforms with a stable public
// "share this URL" web intent that doesn't require app-specific SDK setup.
export function buildFallbackLinks({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    // Instagram, TikTok, and Snapchat intentionally omitted here — no stable
    // public web intent exists for them; native share covers these on mobile.
  };
}

/**
 * High-level helper a component can call directly.
 * Tries native share first, falls back to returning fallback links + copy
 * so the UI can render a share sheet manually.
 */
export async function shareContent({ title, text, url }) {
  if (canUseNativeShare()) {
    return nativeShare({ title, text, url });
  }
  return { method: 'fallback', ok: true, links: buildFallbackLinks({ url, title }) };
}
