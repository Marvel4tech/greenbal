import webpush from "web-push";

webpush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
  process.env.WEB_PUSH_PRIVATE_KEY
);

export async function sendWebPush(subscription, payload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}