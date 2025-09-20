const CACHE_NAME = "punjab-bus-tracker-v1"
const urlsToCache = ["/", "/login", "/signup", "/dashboard", "/manifest.json", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  let notificationData = {
    title: 'Bus Tracker Notification',
    body: 'You have a new update from Bus Tracker',
    icon: '/bus.png',
    badge: '/bus.png',
    data: {}
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.content || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || data.custom_attributes || {},
        tag: data.category || 'general',
        requireInteraction: true,
        actions: data.actions || []
      }
    } catch (e) {
      console.error('Error parsing push notification data:', e)
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  )

  event.waitUntil(promiseChain)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification)

  event.notification.close()

  // Handle different types of notifications
  const notificationData = event.notification.data || {}
  let urlToOpen = '/'

  if (notificationData.category === 'bus_tracking') {
    urlToOpen = '/dashboard'
  } else if (notificationData.category === 'schedule_request') {
    urlToOpen = '/dashboard'
  } else if (notificationData.action_url) {
    urlToOpen = notificationData.action_url
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i]
      if (client.url.includes(urlToOpen) && 'focus' in client) {
        return client.focus()
      }
    }

    // If no window/tab is already open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen)
    }
  })

  event.waitUntil(promiseChain)
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification)
  // You can track notification close events here if needed
})

// Handle background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Handle any queued notifications when coming back online
      console.log('Background sync for notifications')
    )
  }
})

// Handle message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
