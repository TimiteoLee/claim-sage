import { auth } from "@/auth";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createClaimSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  claimNumber: z.string().optional().nullable(),
  status: z
    .enum(["open", "in_review", "approved", "denied", "settled", "closed"])
    .optional()
    .default("open"),
  dateOfLoss: z.string().optional().nullable(),
  claimAmount: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userClaims = await db
    .select()
    .from(claims)
    .where(eq(claims.userId, session.user.id))
    .orderBy(desc(claims.updatedAt));

  return NextResponse.json(userClaims);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createClaimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [claim] = await db
    .insert(claims)
    .values({
      userId: session.user.id,
      title: data.title,
      description: data.description ?? null,
      insuranceCompany: data.insuranceCompany ?? null,
      policyNumber: data.policyNumber ?? null,
      claimNumber: data.claimNumber ?? null,
      status: data.status,
      dateOfLoss: data.dateOfLoss ? new Date(data.dateOfLoss) : null,
      claimAmount: data.claimAmount ?? null,
    })
    .returning();

  return NextResponse.json(claim, { status: 201 });
}
