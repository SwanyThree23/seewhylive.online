/**
 * Haptic feedback utilities for mobile devices.
 * Uses navigator.vibrate — silently no-ops on desktop / unsupported browsers.
 */

export function haptic(pattern = 10) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}

/** Light tap — general button presses */
export function hapticLight() { haptic(10); }

/** Medium tap — confirmations, sends */
export function hapticMedium() { haptic(25); }

/** Success pattern — two quick pulses */
export function hapticSuccess() { haptic([10, 40, 20]); }

/** Warning pattern — long buzz */
export function hapticWarning() { haptic([60]); }