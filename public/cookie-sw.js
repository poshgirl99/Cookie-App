self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const stableTag = data.conversation_id
    ? `cookie-chat-${data.conversation_id}`
    : data.actor_id && data.type
      ? `cookie-${data.type}-${data.actor_id}`
      : `cookie-${data.type || 'notification'}`;
  event.waitUntil(self.registration.showNotification(data.title || 'Cookie', {
    body: data.body || 'New notification',
    icon: '/cookie-logo-deeper-bite.png',
    badge: '/cookie-logo-deeper-bite.png',
    tag: stableTag,
    renotify: true,
    vibrate: [140, 70, 140],
    data: {
      url: data.url || '/',
      type: data.type || null,
      actor_id: data.actor_id || null,
      conversation_id: data.conversation_id || null
    }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const sameOrigin = list.find(client => {
      try { return new URL(client.url).origin === self.location.origin; } catch { return false; }
    });
    if (sameOrigin) {
      if ('navigate' in sameOrigin) await sameOrigin.navigate(target);
      if ('focus' in sameOrigin) return sameOrigin.focus();
    }
    return clients.openWindow(target);
  })());
});
