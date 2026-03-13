"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CircleDot,
  Search as SearchIcon,
  Archive,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ClaimStatus } from "@/db/schema/claims";

interface Claim {
  id: string;
  title: string;
  description: string | null;
  insurance_company: string | null;
  policy_number: string | null;
  claim_number: string | null;
  status: ClaimStatus;
  date_of_loss: string | null;
  claim_amount: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  open: {
    label: "Open",
    className:
      "border border-blue-300 bg-blue-50 text-blue-700",
    icon: CircleDot,
  },
  in_review: {
    label: "In Review",
    className: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-blue-600 text-white",
    icon: CheckCircle2,
  },
  denied: {
    label: "Denied",
    className: "bg-amber-600 text-white",
    icon: AlertTriangle,
  },
  settled: {
    label: "Settled",
    className: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    className: "bg-slate-200 text-slate-600",
    icon: Archive,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.open;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function NewClaimForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      insuranceCompany: (form.get("insuranceCompany") as string) || null,
      policyNumber: (form.get("policyNumber") as string) || null,
      claimNumber: (form.get("claimNumber") as string) || null,
      dateOfLoss: (form.get("dateOfLoss") as string) || null,
      claimAmount: (form.get("claimAmount") as string) || null,
    };

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create claim");
        return;
      }

      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Claim</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Kitchen Fire Claim"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Describe what happened..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="insuranceCompany">Insurance Company</Label>
              <Input
                id="insuranceCompany"
                name="insuranceCompany"
                placeholder="e.g. State Farm"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                name="policyNumber"
                placeholder="e.g. POL-123456"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="claimNumber">Claim Number</Label>
              <Input
                id="claimNumber"
                name="claimNumber"
                placeholder="e.g. CLM-789012"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="claimAmount">Claim Amount</Label>
              <Input
                id="claimAmount"
                name="claimAmount"
                placeholder="e.g. 15000.00"
                className="mt-1"
              />
            </div>
          </div>

          <div className="sm:w-1/2">
            <Label htmlFor="dateOfLoss">Date of Loss</Label>
            <Input
              id="dateOfLoss"
              name="dateOfLoss"
              type="date"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-amber-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Claim"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchClaims() {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClaims();
  }, []);

  const filtered = claims.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.insurance_company?.toLowerCase().includes(q) ?? false) ||
      (c.claim_number?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Claims</h2>
          <p className="text-sm text-slate-500">
            Track and manage your insurance claims
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4" data-icon="inline-start" />
          New Claim
        </Button>
      </div>

      {/* New claim form */}
      {showForm && (
        <NewClaimForm
          onCreated={() => {
            setShowForm(false);
            fetchClaims();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search */}
      {claims.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Claims list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading claims...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-slate-500">
              {claims.length === 0
                ? "No claims yet. Create your first claim to get started."
                : "No claims match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((claim) => (
            <Link key={claim.id} href={`/claims/${claim.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">
                      {claim.title}
                    </CardTitle>
                    <StatusBadge status={claim.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    {claim.insurance_company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>{claim.insurance_company}</span>
                      </div>
                    )}
                    {claim.date_of_loss && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                          Loss:{" "}
                          {new Date(claim.date_of_loss).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {claim.claim_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span>
                          $
                          {Number(claim.claim_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
