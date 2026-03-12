"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, AlertTriangle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const aiProviders = [
  {
    value: "claude",
    label: "Claude (Anthropic)",
    description: "Advanced reasoning and nuanced analysis",
  },
  {
    value: "openai",
    label: "GPT-4o (OpenAI)",
    description: "Fast, versatile general-purpose AI",
  },
] as const;

const roles = [
  { value: "consumer", label: "Consumer" },
  { value: "adjuster", label: "Public Adjuster" },
  { value: "attorney", label: "Attorney" },
  { value: "contractor", label: "Contractor" },
] as const;

interface Settings {
  name: string | null;
  email: string;
  role: string;
  aiProvider: string;
  subscriptionTier: string;
}

export default function SettingsPage() {
  const { update } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setName(data.name || "");
      }
    }
    load();
  }, []);

  async function saveSettings(updates: Partial<Settings>) {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
      setSaved(true);
      // Update session if role changed
      if (updates.role) {
        await update();
      }
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError("Failed to save settings");
    }
    setSaving(false);
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">
          Manage your account and AI preferences
        </p>
      </div>

      {/* Status messages */}
      {saved && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
          <Check className="h-4 w-4 shrink-0" />
          Settings saved
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                onClick={() => saveSettings({ name })}
                disabled={saving || name === settings.name}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={settings.email} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Role</CardTitle>
          <CardDescription>
            This adjusts how Claim Sage communicates with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => saveSettings({ role: role.value })}
                disabled={saving}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                  settings.role === role.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {role.label}
                {settings.role === role.value && (
                  <Check className="ml-1 inline h-3.5 w-3.5" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            AI Provider
          </CardTitle>
          <CardDescription>
            Choose which AI model powers your conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {aiProviders.map((provider) => (
              <button
                key={provider.value}
                onClick={() =>
                  saveSettings({ aiProvider: provider.value })
                }
                disabled={saving}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                  settings.aiProvider === provider.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      settings.aiProvider === provider.value
                        ? "text-blue-700"
                        : "text-slate-900"
                    )}
                  >
                    {provider.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {provider.description}
                  </p>
                </div>
                {settings.aiProvider === provider.value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription>
            Your current plan:{" "}
            <span className="font-medium capitalize">
              {settings.subscriptionTier}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.subscriptionTier === "free" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Free Plan</p>
              <p className="mt-1 text-xs text-amber-700">
                Chat history is not saved between sessions. Upgrade to Pro to
                keep your conversations and access advanced features.
              </p>
              <Button className="mt-3" size="sm" disabled>
                Upgrade to Pro (coming soon)
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">
                Pro Plan
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Chat history is saved. You have access to all features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
