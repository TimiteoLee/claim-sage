import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const [doc] = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.id, id), eq(documents.userId, session.user.id))
    )
    .limit(1);

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  // Delete from Vercel Blob
  await del(doc.url);

  // Delete from DB
  await db.delete(documents).where(eq(documents.id, id));

  return NextResponse.json({ success: true });
}
