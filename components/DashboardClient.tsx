"use client"

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { DashboardData, SearchResultItem } from '@/lib/types';
import { parseWorkflowResponse } from '@/lib/parse';
import { extractIntelligencePayload } from '@/lib/search-parse';
import Topbar from '@/components/Topbar';
import SearchScreen from '@/components/SearchScreen';
import LinkedInIntelligenceDashboard from '@/components/LinkedInIntelligenceDashboard';

interface DashboardClientProps {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ViewState = 'search' | 'loading' | 'dashboard';

export default function DashboardClient({ email }: DashboardClientProps) {
  const isValidEmail = EMAIL_REGEX.test(email.trim());
  const [view, setView] = useState<ViewState>('search');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);

  const analyze = async (item: SearchResultItem) => {
    setSelected(item);
    setError(null);
    setView('loading');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          profile_url: item.profileUrl,
          account_id: item.id,
          slug: item.slug,
          email: email.trim(),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      if (!res.ok || !json.success) {
        setError(json.error ?? `Request failed with status ${res.status}.`);
        setView('search');
        return;
      }
      const payload = extractIntelligencePayload(json.data);
      let parsed = parseWorkflowResponse(payload);
      if (!parsed.company && parsed.posts.length === 0 && parsed.people.length === 0) {
        parsed = parseWorkflowResponse(json.data);
      }
      setData(parsed);
      setView('dashboard');
    } catch {
      setError('Unable to reach the intelligence service. Please try again.');
      setView('search');
    }
  };

  if (!isValidEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-grey-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-grey-200 bg-white p-8 text-center shadow-ds-lg">
          <h1 className="text-xl font-semibold text-grey-900">Access denied</h1>
          <p className="mt-2 text-sm text-grey-600">
            A valid <span className="font-medium">email</span> query parameter is required to view this dashboard.
          </p>
          <p className="mt-3 rounded-lg bg-grey-50 px-3 py-2 font-mono text-xs text-grey-700">?email=you@company.com</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <Topbar
        email={email.trim()}
        loading={view === 'loading'}
        onBack={
          view === 'dashboard'
            ? () => {
                setView('search');
                setData(null);
              }
            : undefined
        }
        onRefresh={view === 'dashboard' && selected ? () => void analyze(selected) : undefined}
      />
      <div className={view === 'search' ? '' : 'hidden'}>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          {error && (
            <div className="mb-4 rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}
          <SearchScreen onSelect={(item) => void analyze(item)} />
        </main>
      </div>
      {view === 'loading' && (
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
          <h2 className="mt-4 text-base font-semibold text-grey-900">
            Gathering LinkedIn Intelligence{selected ? ` for ${selected.name}` : ''}…
          </h2>
          <p className="mt-1 text-sm text-grey-500">This can take a moment while we analyze engagement data.</p>
        </main>
      )}
      {view === 'dashboard' && data && <LinkedInIntelligenceDashboard data={data} />}
    </div>
  );
}
