self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'New Notification', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Brainwave EduSys';
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  const recipientId = event.notification.data?.recipientId;
  let urlToOpen = event.notification.data?.url || '/';
  
  if (recipientId) {
    // Append query param so the frontend can mark it as read when it opens
    const separator = urlToOpen.includes('?') ? '&' : '?';
    urlToOpen = `${urlToOpen}${separator}readPush=${recipientId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and send a message
      for (const client of clientList) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          if (recipientId) {
            client.postMessage({ type: 'PUSH_READ', recipientId });
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
