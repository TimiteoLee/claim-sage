"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  Download,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  category: string;
  createdAt: string;
}

const categories = [
  { value: "policy", label: "Policy" },
  { value: "claim", label: "Claim" },
  { value: "estimate", label: "Estimate" },
  { value: "correspondence", label: "Correspondence" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

const categoryIcons: Record<string, typeof FileText> = {
  policy: FileText,
  claim: FileText,
  estimate: FileText,
  correspondence: FileText,
  photo: Image,
  other: File,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [filter, setFilter] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocs(data);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", selectedCategory);

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setSuccess(`"${file.name}" uploaded`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Upload failed");
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
    setDeletingId(null);
  }

  const filteredDocs = filter
    ? docs.filter((d) => d.category === filter)
    : docs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
          <p className="text-sm text-slate-500">
            Upload and manage your claim documents
          </p>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Upload card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Document</CardTitle>
          <CardDescription>
            PDF, images, Word docs, Excel, or text files up to 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      selectedCategory === cat.value
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      {docs.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filter:</span>
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !filter
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            All ({docs.length})
          </button>
          {categories.map((cat) => {
            const count = docs.filter((d) => d.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === cat.value
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Documents list */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {docs.length === 0
              ? "No documents yet. Upload your first file above."
              : "No documents match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => {
            const Icon = categoryIcons[doc.category] || File;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSize(doc.size)} · {formatDate(doc.createdAt)}
                    <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {doc.category}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
