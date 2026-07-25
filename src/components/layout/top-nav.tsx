"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function TopNav() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    toast.success("Signed out");
  }

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-card">
      <MobileSidebar />
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
