'use strict';
import { VAPID_PUBLIC_KEY } from './pushConfig.js';

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  var supported = 'serviceWorker' in navigator && 'PushManager' in window;

  function getPermissionStatus() {
    if (!supported) return 'unsupported';
    return Notification.permission;
  }

  function subscribe(username, onSuccess, onError) {
    if (!supported) { if (onError) onError('Push not supported'); return; }
    Notification.requestPermission().then(function(permission) {
      if (permission !== 'granted') { if (onError) onError('Permission denied'); return; }
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }).then(function(sub) {
          fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub.toJSON(), username: username }),
          }).then(function(r) { return r.json(); })
            .then(function() { if (onSuccess) onSuccess(sub); })
            .catch(function(e) { if (onError) onError(e); });
        }).catch(function(e) { if (onError) onError(e); });
      });
    });
  }

  function unsubscribe(onDone) {
    if (!supported) return;
    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager.getSubscription().then(function(sub) {
        if (!sub) { if (onDone) onDone(); return; }
        sub.unsubscribe().then(function() {
          fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          }).then(function() { if (onDone) onDone(); });
        });
      });
    });
  }

  function isSubscribed(onResult) {
    if (!supported) { if (onResult) onResult(false); return; }
    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager.getSubscription().then(function(sub) {
        if (onResult) onResult(!!sub);
      });
    });
  }

  return { supported: supported, getPermissionStatus: getPermissionStatus, subscribe: subscribe, unsubscribe: unsubscribe, isSubscribed: isSubscribed };
}
