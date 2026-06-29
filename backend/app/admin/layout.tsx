import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/dashboard/sidebar";
import { TopNavbar } from "@/components/admin/dashboard/top-navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | ShoeHub Admin",
  },
  description: "ShoeHub Admin Dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
