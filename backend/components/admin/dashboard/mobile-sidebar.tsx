"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden animate-in slide-in-from-left duration-300">
            <Sidebar mobile onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
