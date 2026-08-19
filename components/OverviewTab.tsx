"use client"

import { useMemo } from 'react';
import { Award, Building2, MessageSquare, ThumbsUp, UserCheck, Users } from 'lucide-react';
import type { CompanyAggregate, DashboardData, DistributionItem } from '@/lib/types';
import { buildDistribution, formatNumber, initialsOf } from '@/lib/utils';
import { DistributionBar, KpiCard } from '@/components/Widgets';

interface OverviewTabProps {
  data: DashboardData;
  companies: CompanyAggregate[];
  onSelectCompany: (name: string) => void;
}

export default function OverviewTab({ data, companies, onSelectCompany }: OverviewTabProps) {
  const stats = useMemo(() => {
    const totalFromPeople = data.people.reduce((sum, p) => sum + p.engagementCount, 0);
    const totalEngagements = totalFromPeople > 0 ? totalFromPeople : data.engagements.length;
    const uniquePeople = data.people.length;
    const decisionMakers = data.people.filter((p) => p.isDecisionMaker).length;
    const cSuite = data.people.filter((p) => p.seniority === 'C-Level').length;
    const companiesReached = new Set(
      data.people.map((p) => p.companyName.trim().toLowerCase()).filter(Boolean)
    ).size;
    const commentRecords = data.engagements.filter((e) => e.engagementType.toLowerCase().includes('comment')).length;
    const comments = commentRecords > 0 ? commentRecords : data.posts.reduce((sum, p) => sum + p.commentCounter, 0);
    return { totalEngagements, uniquePeople, decisionMakers, cSuite, companiesReached, comments };
  }, [data]);

  const reactionMix = useMemo(() => {
    const fromInteractions = data.people.flatMap((p) => p.interactions.map((i) => i.reactionType)).filter(Boolean);
    const source = fromInteractions.length > 0 ? fromInteractions : data.engagements.map((e) => e.reactionType);
    return buildDistribution(source);
  }, [data]);

  const seniorityMix = useMemo(() => buildDistribution(data.people.map((p) => p.seniority)), [data]);
  const topLocations = useMemo(() => buildDistribution(data.people.map((p) => p.location || p.country)), [data]);
  const employeeMix = useMemo<DistributionItem[]>(() => {
    const internal = data.people.filter((p) => p.isInternal).length;
    const external = data.people.length - internal;
    return [
      { label: 'P² Employees', count: internal },
      { label: 'External', count: external },
    ].filter((item) => item.count > 0);
  }, [data]);

  const topCompanies = companies.slice(0, 10);
  const maxCompanyPeople = topCompanies.reduce((max, c) => Math.max(max, c.peopleCount), 0);

  return (
    <div className="space-y-6">
      {data.company && (
        <div className="flex flex-col gap-4 rounded-xl border border-grey-200 bg-white p-5 shadow-ds-sm sm:flex-row sm:items-center">
          {data.company.logoUrl ? (
            <img src={data.company.logoUrl} alt={data.company.name} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-lg font-semibold text-brand-700">
              {initialsOf(data.company.name || 'Company')}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-grey-900">{data.company.name || 'Company'}</h2>
            {data.company.tagline && <p className="mt-0.5 line-clamp-2 text-sm text-grey-600">{data.company.tagline}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-4 text-xs text-grey-600">
            {data.company.industry && (
              <span>
                <span className="block font-semibold text-grey-900">{data.company.industry}</span>Industry
              </span>
            )}
            {data.company.followerCount > 0 && (
              <span>
                <span className="block font-semibold text-grey-900">{formatNumber(data.company.followerCount)}</span>Followers
              </span>
            )}
            {data.company.employeeCount > 0 && (
              <span>
                <span className="block font-semibold text-grey-900">{formatNumber(data.company.employeeCount)}</span>Employees
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Engagements" value={formatNumber(stats.totalEngagements)} icon={<ThumbsUp className="h-4 w-4" />} />
        <KpiCard label="Unique People" value={formatNumber(stats.uniquePeople)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Decision Makers" value={formatNumber(stats.decisionMakers)} icon={<UserCheck className="h-4 w-4" />} />
        <KpiCard label="C-Suite Reached" value={formatNumber(stats.cSuite)} icon={<Award className="h-4 w-4" />} />
        <KpiCard label="Companies Reached" value={formatNumber(stats.companiesReached)} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Comments" value={formatNumber(stats.comments)} icon={<MessageSquare className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionBar title="Reaction Mix" items={reactionMix} emptyLabel="No reactions recorded." />
        <DistributionBar title="Seniority Mix" items={seniorityMix} emptyLabel="No seniority data." />
        <DistributionBar title="Top Locations" items={topLocations} emptyLabel="No location data." />
        <DistributionBar title="Employee vs. External" items={employeeMix} emptyLabel="No engager data." />
      </div>

      <div className="rounded-xl border border-grey-200 bg-white p-5 shadow-ds-sm">
        <h3 className="text-sm font-semibold text-grey-900">Top Companies Leaderboard</h3>
        <p className="mt-0.5 text-xs text-grey-500">Ranked by total engaged people — click a row for details.</p>
        {topCompanies.length === 0 ? (
          <p className="mt-4 text-xs text-grey-500">No company data yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-grey-100">
            {topCompanies.map((companyAgg, index) => (
              <li key={companyAgg.name}>
                <button
                  type="button"
                  onClick={() => onSelectCompany(companyAgg.name)}
                  className="flex w-full items-center gap-3 rounded-lg py-3 text-left transition hover:bg-grey-50"
                >
                  <span className="w-6 text-center text-xs font-semibold text-grey-400">{index + 1}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                    {initialsOf(companyAgg.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-grey-900">{companyAgg.name}</span>
                    <span className="block text-xs text-grey-500">
                      {companyAgg.decisionMakerCount} decision makers · {companyAgg.totalEngagements} engagements
                    </span>
                  </span>
                  <span className="hidden w-32 sm:block">
                    <span className="block h-1.5 w-full rounded-full bg-grey-100">
                      <span
                        className="block h-1.5 rounded-full bg-brand-600"
                        style={{
                          width: `${maxCompanyPeople > 0 ? Math.max(6, Math.round((companyAgg.peopleCount / maxCompanyPeople) * 100)) : 0}%`,
                        }}
                      />
                    </span>
                  </span>
                  <span className="w-14 text-right text-sm font-semibold text-grey-900">{companyAgg.peopleCount}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
