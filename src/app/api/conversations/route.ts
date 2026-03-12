import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { conversations, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// List conversations
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.subscriptionTier !== "pro") {
    return NextResponse.json([]);
  }

  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  return NextResponse.json(convos);
}

// Create conversation
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.subscriptionTier !== "pro") {
    return NextResponse.json({ error: "Upgrade to Pro to save chat history" }, { status: 403 });
  }

  const [convo] = await db
    .insert(conversations)
    .values({ userId: session.user.id })
    .returning();

  return NextResponse.json(convo, { status: 201 });
}
