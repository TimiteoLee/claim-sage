import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        await db
          .update(users)
          .set({ subscriptionTier: "pro", updatedAt: new Date() })
          .where(eq(users.id, userId));
        console.log(`Upgraded user ${userId} to pro`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // Look up the user via the checkout session metadata
      // Stripe stores the customer ID on the subscription
      const customerId = subscription.customer as string;

      // Find the checkout session that created this subscription to get userId
      const sessions = await stripe.checkout.sessions.list({
        subscription: subscription.id,
        limit: 1,
      });

      const userId = sessions.data[0]?.metadata?.userId;

      if (userId) {
        await db
          .update(users)
          .set({ subscriptionTier: "free", updatedAt: new Date() })
          .where(eq(users.id, userId));
        console.log(`Downgraded user ${userId} to free (subscription ${subscription.id} deleted, customer ${customerId})`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
