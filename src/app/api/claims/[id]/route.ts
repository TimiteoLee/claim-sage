import { auth } from "@/auth";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateClaimSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  claimNumber: z.string().optional().nullable(),
  status: z
    .enum(["open", "in_review", "approved", "denied", "settled", "closed"])
    .optional(),
  dateOfLoss: z.string().optional().nullable(),
  claimAmount: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [claim] = await db
    .select()
    .from(claims)
    .where(and(eq(claims.id, id), eq(claims.userId, session.user.id)))
    .limit(1);

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json(claim);
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = updateClaimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.insuranceCompany !== undefined) updateData.insuranceCompany = data.insuranceCompany;
  if (data.policyNumber !== undefined) updateData.policyNumber = data.policyNumber;
  if (data.claimNumber !== undefined) updateData.claimNumber = data.claimNumber;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dateOfLoss !== undefined)
    updateData.dateOfLoss = data.dateOfLoss ? new Date(data.dateOfLoss) : null;
  if (data.claimAmount !== undefined) updateData.claimAmount = data.claimAmount;

  const [updated] = await db
    .update(claims)
    .set(updateData)
    .where(and(eq(claims.id, id), eq(claims.userId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [deleted] = await db
    .delete(claims)
    .where(and(eq(claims.id, id), eq(claims.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
