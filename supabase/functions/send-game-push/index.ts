// @ts-nocheck

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const FIREBASE_PRIVATE_KEY =
  (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");

function pemToArrayBuffer(pem: string) {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function base64url(input: Uint8Array) {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(FIREBASE_PRIVATE_KEY),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsigned)
  );

  const jwt = `${unsigned}.${base64url(new Uint8Array(signature))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.error_description || data?.error || "Failed to get Google access token"
    );
  }

  return data.access_token as string;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));

    const title = body?.title || "New game posted";
    const message = body?.message || "Predictions are now open!";
    const link = body?.link || "/profile/play";

    const { data: rows, error } = await supabase
      .from("push_subscriptions")
      .select("id, fcm_token, platform, is_active")
      .eq("platform", "fcm")
      .eq("is_active", true)
      .not("fcm_token", "is", null);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokens = (rows || []).map((r) => r.fcm_token).filter(Boolean);

    console.log("FCM rows found:", rows?.length || 0);
    console.log("FCM tokens found:", tokens.length);

    if (!tokens.length) {
      return new Response(
        JSON.stringify({
          sent: 0,
          message: "No active FCM tokens found",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getAccessToken();
    let sent = 0;
    const failed: Array<{ token: string; error: string }> = [];

    for (const token of tokens) {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title,
                body: message,
              },
              webpush: {
                fcm_options: {
                  link,
                },
                notification: {
                  title,
                  body: message,
                  icon: "/icon-192.png",
                },
              },
              data: {
                link,
              },
            },
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (res.ok) {
        sent += 1;
        continue;
      }

      const rawError =
        json?.error?.details?.[0]?.errorCode ||
        json?.error?.status ||
        json?.error?.message ||
        "Unknown FCM error";

      const errorText = String(rawError);

      failed.push({ token, error: errorText });
      console.error("FCM send failed:", errorText, json);

      if (
        errorText.includes("UNREGISTERED") ||
        errorText.includes("registration-token-not-registered")
      ) {
        await supabase
          .from("push_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("fcm_token", token);
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        failed_count: failed.length,
        failed,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-game-push fatal error:", e);

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});