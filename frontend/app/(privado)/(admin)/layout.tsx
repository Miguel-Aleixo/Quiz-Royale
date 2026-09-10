"use client";

import MenuLateral from "@/app/components/MenuLateral";
import { Menu } from "lucide-react";
import { useState } from "react";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <MenuLateral
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo */}
      <main className="min-h-screen lg:pl-72">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#050507]/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="ml-3 font-semibold">
            Quiz<span className="text-indigo-400">Royale</span>
          </span>
        </header>

        {children}
      </main>
    </div>
  );
}