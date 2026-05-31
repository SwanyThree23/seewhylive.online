// Immutable revenue split — never change these values.
var CREATOR_SHARE  = 0.90;
var PLATFORM_SHARE = 0.10;

export function creatorCents(totalCents) {
  return Math.floor(totalCents * CREATOR_SHARE);
}

export function platformCents(totalCents) {
  return totalCents - Math.floor(totalCents * CREATOR_SHARE);
}

export function getPlatformHandles() {
  try { return JSON.parse(localStorage.getItem('sw_platform_handles') || '{}'); } catch(e) { return {}; }
}

export function setPlatformHandle(id, value) {
  var h = getPlatformHandles();
  h[id] = value;
  localStorage.setItem('sw_platform_handles', JSON.stringify(h));
}

export { CREATOR_SHARE, PLATFORM_SHARE };
