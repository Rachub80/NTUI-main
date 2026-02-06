import Stripe from "stripe";
import { headers } from "next/headers";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

type CheckoutItem = {
  name: string;
  price: string;
  qty: number;
};

const parsePriceToCents = (price: string) => {
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
};

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: CheckoutItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const origin = headers().get("origin") ?? "http://localhost:3000";

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items
      .map((item) => {
        const unitAmount = parsePriceToCents(item.price);
        if (!unitAmount || item.qty <= 0) return null;
        return {
          quantity: item.qty,
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
            },
            unit_amount: unitAmount,
          },
        };
      })
      .filter(Boolean) as Stripe.Checkout.SessionCreateParams.LineItem[];

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items to checkout." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unable to create checkout session." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
