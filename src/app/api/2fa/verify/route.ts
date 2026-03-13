import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { totpSecrets } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid code format. Must be 6 digits." },
      { status: 400 }
    );
  }

  // Get the stored secret
  const [record] = await db
    .select()
    .from(totpSecrets)
    .where(eq(totpSecrets.userId, session.user.id))
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { error: "No 2FA setup in progress. Please start setup first." },
      { status: 400 }
    );
  }

  // Validate the TOTP code
  const totp = new OTPAuth.TOTP({
    issuer: "Claim Sage",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(record.secret),
  });

  const delta = totp.validate({ token: parsed.data.code, window: 1 });

  if (delta === null) {
    return NextResponse.json(
      { error: "Invalid code. Please try again." },
      { status: 400 }
    );
  }

  // Mark as verified
  await db
    .update(totpSecrets)
    .set({ verified: true })
    .where(eq(totpSecrets.userId, session.user.id));

  return NextResponse.json({ success: true });
}
