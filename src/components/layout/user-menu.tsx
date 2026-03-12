"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="text-sm font-medium text-slate-900 truncate">
            {user.name ?? "User"}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          Settings (coming soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
