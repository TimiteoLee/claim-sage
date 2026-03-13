import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { totpSecrets, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { createTOTP } from "@/lib/totp";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user email for the TOTP label
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate a new TOTP secret
  const secret = new OTPAuth.Secret({ size: 20 });

  const totp = createTOTP(secret, user.email);

  const otpauthUri = totp.toString();

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(otpauthUri);

  // Upsert the secret (delete any existing unverified entry first)
  await db.delete(totpSecrets).where(eq(totpSecrets.userId, session.user.id));

  await db.insert(totpSecrets).values({
    userId: session.user.id,
    secret: secret.base32,
    verified: false,
  });

  return NextResponse.json({
    qrCode,
    secret: secret.base32,
  });
}
