self.addEventListener("push", (event) => {
    let payload = {};
  
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = {
        title: "Greenball360",
        body: event.data ? event.data.text() : "",
      };
    }
  
    const title = payload.title || "Greenball360";
    const options = {
      body: payload.body || "",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      data: payload.data || {},
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    const link = event.notification?.data?.link || "/";
  
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(link);
            return client.focus();
          }
        }
  
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      })
    );
  });