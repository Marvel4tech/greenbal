import webpush from "web-push";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const PRIVATE_KEY = process.env.WEB_PUSH_PRIVATE_KEY;
const SUBJECT =
  process.env.WEB_PUSH_SUBJECT || "mailto:support@greenball360.com";

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error(
    "Web Push VAPID keys are missing. Check NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY."
  );
}

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

export async function sendWebPush(subscription, payload) {
  try {
    const response = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify({
        title: payload.title || "Greenball360",
        body: payload.body || payload.message || "New update available.",
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/icon-192.png",
        data: payload.data || {
          link: "/",
        },
      })
    );

    console.log("Web push sent successfully:", response?.statusCode || "ok");

    return response;
  } catch (error) {
    console.error(
      "Web push send failed:",
      error?.statusCode,
      error?.body || error?.message || error
    );

    throw error;
  }
}