"use client"

import { useMemo, useState } from 'react';
import type { DashboardData, TabKey } from '@/lib/types';
import { buildCompanyAggregates } from '@/lib/utils';
import OverviewTab from '@/components/OverviewTab';
import PeopleTab from '@/components/PeopleTab';
import CompaniesTab from '@/components/CompaniesTab';
import PostsTab from '@/components/PostsTab';
import PersonDrawer from '@/components/PersonDrawer';
import CompanyDrawer from '@/components/CompanyDrawer';
import PostModal from '@/components/PostModal';

interface LinkedInIntelligenceDashboardProps {
  data: DashboardData;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'people', label: 'People' },
  { key: 'companies', label: 'Companies' },
  { key: 'posts', label: 'Posts' },
];

export default function LinkedInIntelligenceDashboard({ data }: LinkedInIntelligenceDashboardProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [selectedPersonSlug, setSelectedPersonSlug] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const companyAggregates = useMemo(() => buildCompanyAggregates(data.people), [data]);

  const selectedPerson = selectedPersonSlug
    ? data.people.find((p) => p.slug === selectedPersonSlug) ?? null
    : null;
  const selectedCompany = selectedCompanyName
    ? companyAggregates.find((c) => c.name === selectedCompanyName) ?? null
    : null;
  const selectedPost = selectedPostId ? data.posts.find((p) => p.id === selectedPostId) ?? null : null;
  const postEngagers = selectedPost
    ? data.people.filter((p) => selectedPost.engagerSlugs.includes(p.slug))
    : [];

  const openCompanyFromOverview = (name: string) => {
    setTab('companies');
    setSelectedCompanyName(name);
  };

  return (
    <>
      <div className="sticky top-16 z-20 border-b border-grey-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition duration-200 ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-grey-600 hover:text-grey-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {tab === 'overview' ? (
          <OverviewTab data={data} companies={companyAggregates} onSelectCompany={openCompanyFromOverview} />
        ) : tab === 'people' ? (
          <PeopleTab
            people={data.people}
            companyName={data.company?.name ?? ''}
            onSelectPerson={setSelectedPersonSlug}
          />
        ) : tab === 'companies' ? (
          <CompaniesTab companies={companyAggregates} onSelectCompany={setSelectedCompanyName} />
        ) : (
          <PostsTab
            posts={data.posts}
            people={data.people}
            authorName={data.company?.name ?? 'Company'}
            onSelectPost={setSelectedPostId}
          />
        )}
      </main>
      {selectedPerson && (
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
      {selectedPost && (
        <PostModal post={selectedPost} engagers={postEngagers} onClose={() => setSelectedPostId(null)} />
      )}
    </>
  );
}
