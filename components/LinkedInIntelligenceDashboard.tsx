"use client"

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { DashboardData, ProfileDetails, TabKey } from '@/lib/types';
import { decodeUnicodeEscapes, initialsOf } from '@/lib/utils';
import OverviewTab from '@/components/OverviewTab';
import PeopleTab from '@/components/PeopleTab';
import CompaniesTab from '@/components/CompaniesTab';
import PostsTab from '@/components/PostsTab';
import PersonDrawer from '@/components/PersonDrawer';
import CompanyDrawer from '@/components/CompanyDrawer';
import PostModal from '@/components/PostModal';
import { ExpandableText } from '@/components/Widgets';

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
  const peopleForPeopleTab = data.peopleCompanyProfiles ?? data.people;

  const selectedCompany = selectedCompanyName
    ? data.companies.find((company) => company.name === selectedCompanyName) ?? null
    : null;
  const selectedPerson = selectedPersonSlug
    ? peopleForPeopleTab.find((p) => p.slug === selectedPersonSlug) ??
      data.people.find((p) => p.slug === selectedPersonSlug) ??
      null
    : null;
  const selectedPost = selectedPostId ? data.posts.find((p) => p.id === selectedPostId) ?? null : null;

  const openCompanyFromOverview = (name: string) => {
    setTab('companies');
    setSelectedCompanyName(name);
  };

  // Header copy comes from profile_details in the response: company tagline vs
  // personal headline. Parsed company_profile is the fallback.
  const headerName = profileDetails?.name || data.company?.name || '';
  const headerTagline = profileDetails?.tagline || data.company?.tagline || '';
  const headerLogo = profileDetails?.logoUrl || data.company?.logoUrl || '';
  const entityUrl = (profileDetails?.profileUrl || profileUrl || '').trim();
  const displayName = decodeUnicodeEscapes(headerName) || 'Unknown profile';
  const headerDescription = headerTagline ? decodeUnicodeEscapes(headerTagline) : '';
  const avatarClass = profileDetails?.isCompany === false ? 'rounded-full' : 'rounded-xl';
  const showHeader = Boolean(data.company) || Boolean(headerName || headerLogo || headerTagline);
  const showLogo = Boolean(headerLogo) && !logoError;
  const postsAuthor = decodeUnicodeEscapes(profileDetails?.name || data.company?.name || '') || 'Author';

  return (
    <>
      {showHeader && (
        <div className="border-b border-grey-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-start gap-4 px-4 py-5 sm:px-6">
            {showLogo ? (
              <img
                src={headerLogo}
                alt={headerName || 'Entity logo'}
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className={`h-14 w-14 shrink-0 border border-grey-100 object-cover ${avatarClass}`}
              />
            ) : (
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center bg-gradient-to-br from-brand-600 to-purple-600 text-base font-semibold text-white ${avatarClass}`}>
                {initialsOf(headerName || '?')}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-grey-900">{displayName}</h2>
              {headerDescription ? (
                <ExpandableText text={headerDescription} className="mt-0.5 text-sm text-grey-600" />
              ) : null}
            </div>
            {entityUrl && (
              <a
                href={entityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition duration-200 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-600/30"
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
          <OverviewTab
            data={data}
            companies={data.companies}
            onSelectCompany={openCompanyFromOverview}
          />
        ) : tab === 'people' ? (
          <PeopleTab
            people={peopleForPeopleTab}
            posts={data.posts}
            engagements={data.engagements}
            onSelectPerson={setSelectedPersonSlug}
          />
        ) : tab === 'companies' ? (
          <CompaniesTab companies={data.companies} onSelectCompany={setSelectedCompanyName} />
        ) : (
          <PostsTab
            posts={data.posts}
            people={data.people}
            engagements={data.engagements}
            authorName={postsAuthor}
            onSelectPost={setSelectedPostId}
          />
        )}
      </main>
      {selectedPerson && (
        <PersonDrawer
          person={selectedPerson}
          posts={data.posts}
          engagements={data.engagements}
          onClose={() => setSelectedPersonSlug(null)}
        />
      )}
      {selectedCompany && (
        <CompanyDrawer
          company={selectedCompany}
          posts={data.posts}
          engagements={data.engagements}
          onClose={() => setSelectedCompanyName(null)}
          onSelectPerson={(slug) => {
            setSelectedCompanyName(null);
            setSelectedPersonSlug(slug);
          }}
        />
      )}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          people={data.people}
          engagements={data.engagements}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  );
}
