const KEY = 'swl_age_dob';

export function getStoredDob() {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
}

export function setStoredDob(dob) {
  try { localStorage.setItem(KEY, dob); } catch {}
}

export function clearStoredDob() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function calcAge(dobString) {
  if (!dobString) return null;
  const today = new Date();
  const dob   = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function getStoredAge() {
  return calcAge(getStoredDob());
}

// Returns 'host'|'audience'|'viewer'|'blocked' based on age
export function getAccessLevel(age) {
  if (age === null) return null;         // not verified
  if (age < 18)    return 'blocked';     // under 18
  if (age < 21)    return 'audience';    // 18-20: viewer + audience, not host
  return 'host';                          // 21+: full access
}
