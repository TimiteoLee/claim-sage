const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

export interface CourtListenerResult {
  id: number;
  caseName: string;
  court: string;
  dateFiled: string;
  citation: string[];
  snippet: string;
  absoluteUrl: string;
}

interface SearchResponse {
  count: number;
  next: string | null;
  results: Array<{
    id: number;
    caseName?: string;
    court?: string;
    dateFiled?: string;
    citation?: string[];
    snippet?: string;
    absolute_url?: string;
  }>;
}

export async function searchCourtListener(
  query: string,
  options?: {
    court?: string;
    page?: number;
  }
): Promise<{ results: CourtListenerResult[]; count: number }> {
  const params = new URLSearchParams({
    q: query,
    type: "o",
    highlight: "on",
  });

  if (options?.court) params.set("court", options.court);
  if (options?.page) params.set("page", String(options.page));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.COURTLISTENER_API_TOKEN) {
    headers.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }

  const res = await fetch(`${BASE_URL}/search/?${params}`, { headers });

  if (!res.ok) {
    throw new Error(`CourtListener API error: ${res.status}`);
  }

  const data: SearchResponse = await res.json();

  return {
    count: data.count,
    results: data.results.map((r) => ({
      id: r.id,
      caseName: r.caseName || "Unknown Case",
      court: r.court || "",
      dateFiled: r.dateFiled || "",
      citation: r.citation || [],
      snippet: r.snippet || "",
      absoluteUrl: r.absolute_url
        ? `https://www.courtlistener.com${r.absolute_url}`
        : "",
    })),
  };
}
