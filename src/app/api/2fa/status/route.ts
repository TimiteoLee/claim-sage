import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { totpSecrets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [record] = await db
    .select({ verified: totpSecrets.verified })
    .from(totpSecrets)
    .where(eq(totpSecrets.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    enabled: record?.verified ?? false,
  });
}
