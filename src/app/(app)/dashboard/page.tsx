"use client";

import { useSession } from "next-auth/react";
import { MessageSquare, FolderOpen, FileText, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const roleLabels: Record<string, string> = {
  consumer: "Consumer",
  adjuster: "Public Adjuster",
  attorney: "Attorney",
};

const comingSoonCards = [
  {
    title: "AI Chat",
    description:
      "Get instant guidance on your insurance claims from our AI assistant.",
    icon: MessageSquare,
  },
  {
    title: "Cases",
    description:
      "Organize and track your insurance claims in one place.",
    icon: FolderOpen,
  },
  {
    title: "Documents",
    description:
      "Upload and analyze your policy documents and claim paperwork.",
    icon: FileText,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] ?? "there";
  const roleLabel = roleLabels[user.role] ?? user.role;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {firstName}
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Coming soon cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {comingSoonCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <div className="absolute right-3 top-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </span>
              </div>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <p className="text-sm text-slate-400">Available soon</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
