import { env } from "../config/env.js";

type PayPalMode = "sandbox" | "live";

function getBaseUrl(mode: PayPalMode) {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  const mode = (env.PAYPAL_MODE ?? "sandbox") as PayPalMode;
  const clientId = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal is not configured (missing PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET)");
  }

  const baseUrl = getBaseUrl(mode);
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(args: {
  amount: number;
  currency?: string;
  projectTitle: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const mode = (env.PAYPAL_MODE ?? "sandbox") as PayPalMode;
  const baseUrl = getBaseUrl(mode);
  const token = await getAccessToken();

  const currency = args.currency ?? "USD";

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: args.projectTitle,
          amount: {
            currency_code: currency,
            value: args.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  const approveLink = (data.links ?? []).find((l: any) => l.rel === "approve")?.href as string | undefined;

  return {
    orderId: data.id as string,
    approveUrl: approveLink,
    raw: data,
  };
}

export async function capturePayPalOrder(orderId: string) {
  const mode = (env.PAYPAL_MODE ?? "sandbox") as PayPalMode;
  const baseUrl = getBaseUrl(mode);
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
    data.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

  return { captureId: captureId as string | undefined, raw: data };
}
