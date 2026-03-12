import { Shield } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">
              Claim Sage
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
