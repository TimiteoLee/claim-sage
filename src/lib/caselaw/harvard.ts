const BASE_URL = "https://api.case.law/v1";

export interface HarvardCaseResult {
  id: number;
  name: string;
  nameAbbreviation: string;
  decisionDate: string;
  docketNumber: string;
  citations: Array<{ cite: string; type: string }>;
  court: string;
  jurisdiction: string;
  url: string;
}

interface CasesResponse {
  count: number;
  next: string | null;
  results: Array<{
    id: number;
    name: string;
    name_abbreviation: string;
    decision_date: string;
    docket_number: string;
    citations: Array<{ cite: string; type: string }>;
    court: { name: string };
    jurisdiction: { name: string };
    url: string;
  }>;
}

export async function searchHarvardCaselaw(
  query: string,
  options?: {
    jurisdiction?: string;
    page?: number;
  }
): Promise<{ results: HarvardCaseResult[]; count: number }> {
  const params = new URLSearchParams({
    search: query,
  });

  if (options?.jurisdiction) params.set("jurisdiction", options.jurisdiction);
  if (options?.page) params.set("page", String(options.page));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.HARVARD_CASELAW_API_TOKEN) {
    headers.Authorization = `Token ${process.env.HARVARD_CASELAW_API_TOKEN}`;
  }

  const res = await fetch(`${BASE_URL}/cases/?${params}`, { headers });

  if (!res.ok) {
    throw new Error(`Harvard Caselaw API error: ${res.status}`);
  }

  const data: CasesResponse = await res.json();

  return {
    count: data.count,
    results: data.results.map((r) => ({
      id: r.id,
      name: r.name,
      nameAbbreviation: r.name_abbreviation,
      decisionDate: r.decision_date,
      docketNumber: r.docket_number,
      citations: r.citations || [],
      court: r.court?.name || "",
      jurisdiction: r.jurisdiction?.name || "",
      url: r.url || "",
    })),
  };
}
