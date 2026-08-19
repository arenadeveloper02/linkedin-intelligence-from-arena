"use client"

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardData, TabKey } from '@/lib/types';
import { parseWorkflowResponse } from '@/lib/parse';
import { buildCompanyAggregates } from '@/lib/utils';
import Topbar from '@/components/Topbar';
import OverviewTab from '@/components/OverviewTab';
import PeopleTab from '@/components/PeopleTab';
import CompaniesTab from '@/components/CompaniesTab';
import PostsTab from '@/components/PostsTab';
import PersonDrawer from '@/components/PersonDrawer';
import CompanyDrawer from '@/components/CompanyDrawer';
import PostModal from '@/components/PostModal';
import { DashboardSkeleton } from '@/components/Widgets';

interface DashboardClientProps {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'people', label: 'People' },
  { key: 'companies', label: 'Companies' },
  { key: 'posts', label: 'Posts' },
];

export default function DashboardClient({ email }: DashboardClientProps) {
  const isValidEmail = EMAIL_REGEX.test(email.trim());
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState<boolean>(isValidEmail);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedPersonSlug, setSelectedPersonSlug] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isValidEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      if (!res.ok || !json.success) {
        setError(json.error ?? `Request failed with status ${res.status}.`);
        setData(null);
      } else {
        setData(parseWorkflowResponse(json.data));
      }
    } catch {
      setError('Unable to reach the intelligence service. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [email, isValidEmail]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const companyAggregates = useMemo(() => (data ? buildCompanyAggregates(data.people) : []), [data]);

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

  const selectedPerson =
    data && selectedPersonSlug ? data.people.find((p) => p.slug === selectedPersonSlug) ?? null : null;
  const selectedCompany = selectedCompanyName
    ? companyAggregates.find((c) => c.name === selectedCompanyName) ?? null
    : null;
  const selectedPost = data && selectedPostId ? data.posts.find((p) => p.id === selectedPostId) ?? null : null;
  const postEngagers =
    data && selectedPost ? data.people.filter((p) => selectedPost.engagerSlugs.includes(p.slug)) : [];

  const openCompanyFromOverview = (name: string) => {
    setTab('companies');
    setSelectedCompanyName(name);
  };

  return (
    <div className="min-h-screen bg-grey-50">
      <Topbar email={email.trim()} loading={loading} onRefresh={() => void fetchData()} />
      <div className="sticky top-16 z-20 border-b border-grey-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition duration-200 ${
                tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-grey-600 hover:text-grey-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-error-300 bg-error-50 p-8 text-center">
            <h2 className="text-base font-semibold text-error-700">Unable to load intelligence data</h2>
            <p className="mt-2 text-sm text-grey-600">{error}</p>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition duration-200 hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-600/30"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          tab === 'overview' ? (
            <OverviewTab data={data} companies={companyAggregates} onSelectCompany={openCompanyFromOverview} />
          ) : tab === 'people' ? (
            <PeopleTab people={data.people} onSelectPerson={setSelectedPersonSlug} />
          ) : tab === 'companies' ? (
            <CompaniesTab companies={companyAggregates} onSelectCompany={setSelectedCompanyName} />
          ) : (
            <PostsTab
              posts={data.posts}
              people={data.people}
              authorName={data.company?.name ?? 'Company'}
              onSelectPost={setSelectedPostId}
            />
          )
        ) : null}
      </main>
      {selectedPerson && data && (
        <PersonDrawer person={selectedPerson} posts={data.posts} onClose={() => setSelectedPersonSlug(null)} />
      )}
      {selectedCompany && (
        <CompanyDrawer
          company={selectedCompany}
          onClose={() => setSelectedCompanyName(null)}
          onSelectPerson={(slug) => {
            setSelectedCompanyName(null);
            setSelectedPersonSlug(slug);
          }}
        />
      )}
      {selectedPost && <PostModal post={selectedPost} engagers={postEngagers} onClose={() => setSelectedPostId(null)} />}
    </div>
  );
}
