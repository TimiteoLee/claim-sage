import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  aiProvider: z.enum(["claude", "openai"]).optional(),
  role: z.enum(["consumer", "adjuster", "attorney", "contractor"]).optional(),
  name: z.string().min(1).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      role: users.role,
      aiProvider: users.aiProvider,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.aiProvider) updates.aiProvider = parsed.data.aiProvider;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.name) updates.name = parsed.data.name;

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
