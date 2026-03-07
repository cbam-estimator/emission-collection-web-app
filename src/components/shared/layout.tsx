"use client";

import { useState } from "react";
import { CBAMSidebar } from "./sidebar";
import { CBAMHeader } from "./header";
import { InstallationProvider } from "@/contexts/installation-context";

interface CBAMLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CBAMLayout({
  children,
  title = "Getting Started",
}: CBAMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <InstallationProvider>
      <div className="bg-muted/30 flex h-screen">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-72" : "w-0"
          }`}
        >
          <CBAMSidebar />
        </div>

        <div className="flex flex-1 flex-col">
          <CBAMHeader
            title={title}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />
          <main className="flex flex-1 flex-col overflow-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </InstallationProvider>
  );
}
