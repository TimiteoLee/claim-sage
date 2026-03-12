"use client";

import Link from "next/link";
import {
  Shield,
  MessageSquare,
  FileText,
  Scale,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Guidance",
    description:
      "Get instant, expert answers about your insurance claim process, coverage questions, and next steps.",
  },
  {
    icon: FileText,
    title: "Document Analysis",
    description:
      "Upload your policy documents and claim paperwork for intelligent analysis and recommendations.",
  },
  {
    icon: Scale,
    title: "Role-Based Expertise",
    description:
      "Tailored guidance whether you're a consumer, public adjuster, or attorney handling claims.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">
              Claim Sage
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Sign In
            </Link>
            <Link href="/register" className={cn(buttonVariants())}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 to-white py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Expert Insurance Claim Guidance,{" "}
              <span className="text-blue-600">Powered by AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Navigate your insurance claim with confidence. Claim Sage provides
              intelligent guidance tailored to your role — whether you&apos;re a
              policyholder, public adjuster, or attorney.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" })
                )}
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm text-slate-500">
            Claim Sage provides informational guidance, not legal advice. Always
            consult a licensed professional for legal matters.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Claim Sage. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
