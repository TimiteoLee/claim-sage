"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldOff, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "loading" | "disabled" | "setup" | "enabled";

export function TwoFactorSetup() {
  const [status, setStatus] = useState<Status>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/2fa/setup", { method: "GET" });
        // GET isn't defined, so we check via a different approach
        // We'll just check the status on mount by trying to see if there's an existing verified secret
        // Since we don't have a GET endpoint, we'll use a simple status check
        setStatus("disabled");
      } catch {
        setStatus("disabled");
      }
    }

    // Check 2FA status via a dedicated lightweight call
    async function check2FAStatus() {
      try {
        const res = await fetch("/api/2fa/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data.enabled ? "enabled" : "disabled");
        } else {
          setStatus("disabled");
        }
      } catch {
        setStatus("disabled");
      }
    }

    check2FAStatus();
  }, []);

  async function startSetup() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/setup", { method: "POST" });
      if (!res.ok) {
        setError("Failed to start 2FA setup. Please try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setQrCode(data.qrCode);
      setManualSecret(data.secret);
      setStatus("setup");
    } catch {
      setError("Failed to start 2FA setup. Please try again.");
    }
    setSubmitting(false);
  }

  async function verifyCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setSubmitting(false);
        return;
      }
      setStatus("enabled");
      setQrCode(null);
      setManualSecret(null);
      setCode("");
    } catch {
      setError("Verification failed. Please try again.");
    }
    setSubmitting(false);
  }

  async function disable2FA() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to disable 2FA.");
        setSubmitting(false);
        return;
      }
      setStatus("disabled");
      setShowDisable(false);
      setDisableCode("");
    } catch {
      setError("Failed to disable 2FA. Please try again.");
    }
    setSubmitting(false);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking 2FA status...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current status */}
      {status === "enabled" && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="font-medium">2FA Enabled</span> — Your account is protected with two-factor authentication.
        </div>
      )}

      {status === "disabled" && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <ShieldOff className="h-4 w-4 shrink-0" />
          <span className="font-medium">2FA Disabled</span> — Add an extra layer of security to your account.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Setup flow */}
      {status === "disabled" && (
        <Button onClick={startSetup} disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shield className="mr-2 h-4 w-4" />
          )}
          Enable 2FA
        </Button>
      )}

      {status === "setup" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
          </p>

          {qrCode && (
            <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
            </div>
          )}

          {manualSecret && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">
                Or enter this code manually:
              </Label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm tracking-wider text-slate-700 select-all">
                {manualSecret}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="totp-code">
              Enter the 6-digit code from your authenticator app:
            </Label>
            <div className="flex gap-2">
              <Input
                id="totp-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="font-mono tracking-widest"
                autoComplete="one-time-code"
              />
              <Button
                onClick={verifyCode}
                disabled={submitting || code.length !== 6}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disable flow */}
      {status === "enabled" && !showDisable && (
        <Button
          variant="outline"
          onClick={() => setShowDisable(true)}
          className="text-amber-700 border-amber-300 hover:bg-amber-50"
        >
          <ShieldOff className="mr-2 h-4 w-4" />
          Disable 2FA
        </Button>
      )}

      {status === "enabled" && showDisable && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Enter your current authenticator code to confirm disabling 2FA:
          </p>
          <div className="flex gap-2">
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="font-mono tracking-widest"
              autoComplete="one-time-code"
            />
            <Button
              onClick={disable2FA}
              disabled={submitting || disableCode.length !== 6}
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="mr-2 h-4 w-4" />
              )}
              Confirm Disable
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDisable(false);
                setDisableCode("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
