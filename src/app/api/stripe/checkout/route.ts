import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST() {
  const stripe = getStripe();
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user email from DB
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured" },
      { status: 500 }
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user.email,
    metadata: {
      userId: session.user.id,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
