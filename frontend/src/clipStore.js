// Persists recorded clips to IndexedDB; metadata index in localStorage.
var DB_NAME = 'sw_clips';
var DB_VER  = 1;
var STORE   = 'clips';

function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = function(e) {
      e.target.result.createObjectStore(STORE);
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror   = function(e) { reject(e.target.error); };
  });
}

export function saveClip(id, blob, meta) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx  = db.transaction(STORE, 'readwrite');
      var req = tx.objectStore(STORE).put(blob, id);
      req.onsuccess = function() {
        var metas = listClips();
        metas = metas.filter(function(m) { return m.id !== id; });
        metas.unshift(Object.assign({ id: id }, meta));
        metas = metas.slice(0, 50);
        localStorage.setItem('sw_clips_meta', JSON.stringify(metas));
        resolve();
      };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

export function loadClip(id) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx  = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).get(id);
      req.onsuccess = function(e) { resolve(e.target.result || null); };
      req.onerror   = function(e) { reject(e.target.error); };
    });
  });
}

export function deleteClip(id) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx  = db.transaction(STORE, 'readwrite');
      var req = tx.objectStore(STORE).delete(id);
      req.onsuccess = function() {
        var metas = listClips().filter(function(m) { return m.id !== id; });
        localStorage.setItem('sw_clips_meta', JSON.stringify(metas));
        resolve();
      };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

export function listClips() {
  try { return JSON.parse(localStorage.getItem('sw_clips_meta') || '[]'); } catch(e) { return []; }
}
