import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchCourtListener } from "@/lib/caselaw/courtlistener";
import { searchHarvardCaselaw } from "@/lib/caselaw/harvard";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const source = searchParams.get("source") || "both";
  const jurisdiction = searchParams.get("jurisdiction") || undefined;
  const page = parseInt(searchParams.get("page") || "1");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const results: {
    courtlistener?: { results: unknown[]; count: number };
    harvard?: { results: unknown[]; count: number };
  } = {};

  const promises: Promise<void>[] = [];

  if (source === "both" || source === "courtlistener") {
    promises.push(
      searchCourtListener(query, { court: jurisdiction, page })
        .then((data) => {
          results.courtlistener = data;
        })
        .catch(() => {
          results.courtlistener = { results: [], count: 0 };
        })
    );
  }

  if (source === "both" || source === "harvard") {
    promises.push(
      searchHarvardCaselaw(query, { jurisdiction, page })
        .then((data) => {
          results.harvard = data;
        })
        .catch(() => {
          results.harvard = { results: [], count: 0 };
        })
    );
  }

  await Promise.all(promises);

  return NextResponse.json(results);
}
