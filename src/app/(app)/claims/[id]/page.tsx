"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
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

interface Claim {
  id: string;
  title: string;
  description: string | null;
  insurance_company: string | null;
  policy_number: string | null;
  claim_number: string | null;
  status: string;
  date_of_loss: string | null;
  claim_amount: string | null;
  created_at: string;
  updated_at: string;
}

const statusOptions = [
  { value: "open", label: "Open", icon: CircleDot },
  { value: "in_review", label: "In Review", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle2 },
  { value: "denied", label: "Denied", icon: AlertTriangle },
  { value: "settled", label: "Settled", icon: CheckCircle2 },
  { value: "closed", label: "Closed", icon: Archive },
] as const;

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "border border-blue-300 bg-blue-50 text-blue-700" },
  in_review: { label: "In Review", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-blue-600 text-white" },
  denied: { label: "Denied", className: "bg-amber-600 text-white" },
  settled: { label: "Settled", className: "bg-blue-100 text-blue-800" },
  closed: { label: "Closed", className: "bg-slate-200 text-slate-600" },
};

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [status, setStatus] = useState("open");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [claimAmount, setClaimAmount] = useState("");

  const populateForm = useCallback((c: Claim) => {
    setTitle(c.title);
    setDescription(c.description ?? "");
    setInsuranceCompany(c.insurance_company ?? "");
    setPolicyNumber(c.policy_number ?? "");
    setClaimNumber(c.claim_number ?? "");
    setStatus(c.status);
    setDateOfLoss(
      c.date_of_loss
        ? new Date(c.date_of_loss).toISOString().split("T")[0]
        : ""
    );
    setClaimAmount(c.claim_amount ?? "");
  }, []);

  useEffect(() => {
    async function fetchClaim() {
      try {
        const res = await fetch(`/api/claims/${id}`);
        if (!res.ok) {
          setError("Claim not found");
          return;
        }
        const data = await res.json();
        setClaim(data);
        populateForm(data);
      } catch {
        setError("Failed to load claim");
      } finally {
        setLoading(false);
      }
    }
    fetchClaim();
  }, [id, populateForm]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          insuranceCompany: insuranceCompany || null,
          policyNumber: policyNumber || null,
          claimNumber: claimNumber || null,
          status,
          dateOfLoss: dateOfLoss || null,
          claimAmount: claimAmount || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }

      const updated = await res.json();
      setClaim(updated);
      setSuccess("Claim updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/claims/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/claims");
      } else {
        setError("Failed to delete claim");
      }
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading claim...</p>
      </div>
    );
  }

  if (!claim && error) {
    return (
      <div className="space-y-4">
        <Link href="/claims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" data-icon="inline-start" />
            Back to Claims
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-2 h-8 w-8 text-amber-500" />
            <p className="text-sm text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = statusConfig[status] ?? statusConfig.open;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/claims">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{claim?.title}</h2>
            <p className="text-xs text-slate-400">
              Created{" "}
              {claim ? new Date(claim.created_at).toLocaleDateString() : ""}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${currentStatus.className}`}
        >
          {currentStatus.label}
        </span>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                <Input
                  id="insuranceCompany"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  value={claimNumber}
                  onChange={(e) => setClaimNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="claimAmount">Claim Amount</Label>
                <Input
                  id="claimAmount"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dateOfLoss">Date of Loss</Label>
                <Input
                  id="dateOfLoss"
                  type="date"
                  value={dateOfLoss}
                  onChange={(e) => setDateOfLoss(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-blue-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" data-icon="inline-start" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>

              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Are you sure?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                      onClick={handleDelete}
                    >
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" data-icon="inline-start" />
                    Delete Claim
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
