"use client"

import { Radar, RefreshCw } from 'lucide-react';

interface TopbarProps {
  email: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function Topbar({ loading, onRefresh }: TopbarProps) {
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
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-grey-200 bg-white px-4 text-sm font-medium text-grey-700 transition duration-200 hover:border-brand-600 hover:text-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
