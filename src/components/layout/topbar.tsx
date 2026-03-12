"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
    </header>
  );
}
