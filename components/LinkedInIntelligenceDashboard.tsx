"use client"

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { DashboardData, ProfileDetails, TabKey } from '@/lib/types';
import { buildCompanyAggregates, decodeUnicodeEscapes, initialsOf } from '@/lib/utils';
import OverviewTab from '@/components/OverviewTab';
import PeopleTab from '@/components/PeopleTab';
import CompaniesTab from '@/components/CompaniesTab';
import PostsTab from '@/components/PostsTab';
import PersonDrawer from '@/components/PersonDrawer';
import CompanyDrawer from '@/components/CompanyDrawer';
import PostModal from '@/components/PostModal';

interface LinkedInIntelligenceDashboardProps {
  data: DashboardData;
  profileUrl?: string;
  profileDetails?: ProfileDetails | null;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'people', label: 'People' },
  { key: 'companies', label: 'Companies' },
  { key: 'posts', label: 'Posts' },
];

export default function LinkedInIntelligenceDashboard({ data, profileUrl, profileDetails }: LinkedInIntelligenceDashboardProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [selectedPersonSlug, setSelectedPersonSlug] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

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

  // Entity profile summary header: prefer the parsed company_profile, fall back to profile_details.
  const headerName = data.company?.name || profileDetails?.name || '';
  const headerTagline = data.company?.tagline || profileDetails?.tagline || '';
  const headerLogo = data.company?.logoUrl || profileDetails?.logoUrl || '';
  const entityUrl = ((profileUrl ?? '') || profileDetails?.profileUrl || '').trim();
  const showHeader = Boolean(data.company) || Boolean(headerName || headerLogo || headerTagline);
  const showLogo = Boolean(headerLogo) && !logoError;

  return (
    <>
      {showHeader && (
        <div className="border-b border-grey-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-5 sm:px-6">
            {showLogo ? (
              <img
                src={headerLogo}
                alt={headerName || 'Entity logo'}
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-14 w-14 shrink-0 rounded-xl border border-grey-100 object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-base font-semibold text-white">
                {initialsOf(headerName || '?')}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-grey-900">
                {decodeUnicodeEscapes(headerName) || 'Unknown'}
              </h2>
              {headerTagline && (
                <p className="mt-0.5 line-clamp-2 text-sm text-grey-600">
                  {decodeUnicodeEscapes(headerTagline)}
                </p>
              )}
            </div>
            {entityUrl && (
              <a
                href={entityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition duration-200 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-600/30"
              >
                View Profile
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
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
