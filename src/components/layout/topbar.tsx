"use client";

import { Bell, Search, User } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-neutral-200 shrink-0">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar cotações, fornecedores..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-[var(--radius-md)] placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-[var(--radius-md)] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-danger rounded-full" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] hover:bg-neutral-50 transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:block text-sm font-medium text-neutral-700">
            João
          </span>
        </button>
      </div>
    </header>
  );
}
