"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  BookOpen,
  Library,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CourtListenerResult {
  id: number;
  caseName: string;
  court: string;
  dateFiled: string;
  citation: string[];
  snippet: string;
  absoluteUrl: string;
}

interface HarvardResult {
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

type Source = "both" | "courtlistener" | "harvard";

const sources: Array<{ value: Source; label: string; icon: typeof BookOpen }> = [
  { value: "both", label: "All Sources", icon: Library },
  { value: "courtlistener", label: "CourtListener", icon: BookOpen },
  { value: "harvard", label: "Harvard Caselaw", icon: BookOpen },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export default function CaseLawPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("both");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courtlistenerResults, setCourtlistenerResults] = useState<
    CourtListenerResult[]
  >([]);
  const [harvardResults, setHarvardResults] = useState<HarvardResult[]>([]);
  const [courtlistenerCount, setCourtlistenerCount] = useState(0);
  const [harvardCount, setHarvardCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: query,
        source,
      });

      const res = await fetch(`/api/caselaw?${params}`);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();

      setCourtlistenerResults(data.courtlistener?.results || []);
      setCourtlistenerCount(data.courtlistener?.count || 0);
      setHarvardResults(data.harvard?.results || []);
      setHarvardCount(data.harvard?.count || 0);
    } catch {
      setError("Search failed. Please try again.");
    }

    setLoading(false);
  }

  const totalResults = courtlistenerCount + harvardCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Case Law Search</h2>
        <p className="text-sm text-slate-500">
          Search federal and state court opinions from CourtListener and Harvard
          Caselaw Access Project
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search cases, e.g. "bad faith insurance denial" or "500 U.S. 1"'
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              {sources.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    source === s.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <p className="text-sm text-slate-500">
          {totalResults.toLocaleString()} result{totalResults !== 1 ? "s" : ""}{" "}
          found
        </p>
      )}

      {/* CourtListener results */}
      {courtlistenerResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BookOpen className="h-4 w-4" />
            CourtListener ({courtlistenerCount.toLocaleString()})
          </h3>
          {courtlistenerResults.map((result) => (
            <Card key={`cl-${result.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm leading-tight">
                      {result.caseName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {result.court}
                      {result.dateFiled && ` · ${result.dateFiled}`}
                      {result.citation?.length > 0 &&
                        ` · ${result.citation.join(", ")}`}
                    </CardDescription>
                  </div>
                  {result.absoluteUrl && (
                    <a
                      href={result.absoluteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardHeader>
              {result.snippet && (
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-600 line-clamp-3">
                    {stripHtml(result.snippet)}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Harvard results */}
      {harvardResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Library className="h-4 w-4" />
            Harvard Caselaw ({harvardCount.toLocaleString()})
          </h3>
          {harvardResults.map((result) => (
            <Card key={`hv-${result.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm leading-tight">
                      {result.nameAbbreviation || result.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {result.court}
                      {result.jurisdiction && ` · ${result.jurisdiction}`}
                      {result.decisionDate && ` · ${result.decisionDate}`}
                      {result.citations?.length > 0 &&
                        ` · ${result.citations.map((c) => c.cite).join(", ")}`}
                    </CardDescription>
                  </div>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardHeader>
              {result.docketNumber && (
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-500">
                    Docket: {result.docketNumber}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {hasSearched &&
        !loading &&
        courtlistenerResults.length === 0 &&
        harvardResults.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No cases found. Try different search terms.
            </p>
          </div>
        )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <Search className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Search for case law
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Try keywords like &quot;bad faith insurance&quot; or a citation like
            &quot;500 U.S. 1&quot;
          </p>
        </div>
      )}
    </div>
  );
}
