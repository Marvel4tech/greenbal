importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyAQuZp6KmreJBOa0uXcjCmDYv6M6qWA0qQ",
  authDomain: "greenball360-push-notification.firebaseapp.com",
  projectId: "greenball360-push-notification",
  messagingSenderId: "1095378679484",
  appId: "1:1095378679484:web:585482a6d68dff1d25c2b9",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New game posted"
  const options = {
    body: payload.notification?.body || "Predictions are now open.",
    icon: "/icon-192.png",
    data: payload.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const link = event.notification?.data?.link || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(link)
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(link)
      }
    })
  )
})