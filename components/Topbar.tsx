"use client"

import { useState } from 'react';
import { ChevronDown, Radar, RefreshCw } from 'lucide-react';
import { displayNameFromEmail, initialsOf } from '@/lib/utils';

interface TopbarProps {
  email: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function Topbar({ email, loading, onRefresh }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = displayNameFromEmail(email);
  return (
    <header className="sticky top-0 z-30 border-b border-grey-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Radar className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-grey-900 sm:text-base">LinkedIn Intelligence</h1>
            <p className="hidden text-xs text-grey-500 sm:block">Engagement analytics dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-grey-200 px-3 py-2 text-xs font-medium text-grey-700 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-grey-200 px-2 py-1.5 transition hover:border-brand-600"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {initialsOf(name)}
              </span>
              <span className="hidden max-w-[140px] truncate text-left text-xs font-medium text-grey-900 md:block">{name}</span>
              <ChevronDown className={`h-4 w-4 text-grey-500 transition ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-grey-200 bg-white p-4 shadow-ds-lg">
                <p className="text-sm font-semibold text-grey-900">{name}</p>
                <p className="mt-0.5 truncate text-xs text-grey-500">{email}</p>
                <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
                  Identity derived from the email URL parameter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
