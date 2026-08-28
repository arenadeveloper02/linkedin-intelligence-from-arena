"use client"

import { useMemo } from 'react';
import { Award, MessageSquare, ThumbsUp, UserCheck, Users } from 'lucide-react';
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
    const companyProfilePeople = data.peopleCompanyProfiles ?? [];
    const uniquePeople = companyProfilePeople.length;
    const decisionMakers = companyProfilePeople.filter(
      (p) => p.isDecisionMaker || p.seniority === 'C-Level' || p.seniority === 'Director'
    ).length;
    const cSuite = companyProfilePeople.filter((p) => p.seniority === 'C-Level').length;
    const commentRecords = data.engagements.filter((e) => e.engagementType.toLowerCase().includes('comment')).length;
    const comments = commentRecords > 0 ? commentRecords : data.posts.reduce((sum, p) => sum + p.commentCounter, 0);
    return { totalEngagements, uniquePeople, decisionMakers, cSuite, comments };
  }, [data]);

  const reactionMix = useMemo(() => {
    const fromInteractions = data.people.flatMap((p) => p.interactions.map((i) => i.reactionType)).filter(Boolean);
    const source = fromInteractions.length > 0 ? fromInteractions : data.engagements.map((e) => e.reactionType);
    return buildDistribution(source);
  }, [data]);

  const seniorityMix = useMemo(() => buildDistribution(data.people.map((p) => p.seniority)), [data]);
  const employeeMix = useMemo<DistributionItem[]>(() => {
    const internal = data.people.filter((p) => p.isInternal).length;
    const external = data.people.length - internal;
    return [
      { label: 'P² Employees', count: internal },
      { label: 'External', count: external },
    ].filter((item) => item.count > 0);
  }, [data]);

  const topCompanies = useMemo(
    () =>
      [...companies]
        .sort(
          (a, b) =>
            b.totalEngagements - a.totalEngagements ||
            b.peopleCount - a.peopleCount ||
            a.name.localeCompare(b.name)
        )
        .slice(0, 10),
    [companies]
  );
  const maxCompanyPeople = topCompanies.reduce((max, company) => Math.max(max, company.peopleCount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total Engagements" value={formatNumber(stats.totalEngagements)} icon={<ThumbsUp className="h-4 w-4" />} />
        <KpiCard label="Unique People" value={formatNumber(stats.uniquePeople)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Decision Makers" value={formatNumber(stats.decisionMakers)} icon={<UserCheck className="h-4 w-4" />} />
        <KpiCard label="C-Suite Reached" value={formatNumber(stats.cSuite)} icon={<Award className="h-4 w-4" />} />
        <KpiCard label="Comments" value={formatNumber(stats.comments)} icon={<MessageSquare className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DistributionBar title="Reaction Mix" items={reactionMix} emptyLabel="No reactions recorded." />
        <DistributionBar title="Seniority Mix" items={seniorityMix} emptyLabel="No seniority data." />
        <DistributionBar title="Employee vs. External" items={employeeMix} emptyLabel="No engager data." />
      </div>

      <div className="rounded-xl border border-grey-200 bg-white p-5 shadow-ds-sm">
        <h3 className="text-sm font-semibold text-grey-900">Top Companies by Engagement</h3>
        <p className="mt-0.5 text-xs text-grey-500">Ranked by total engagements from current-company data.</p>
        {topCompanies.length === 0 ? (
          <p className="mt-4 text-xs text-grey-500">No company data yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-grey-100">
            {topCompanies.map((company, index) => (
              <li key={`${company.companyId}-${company.name}`}>
                <button
                  type="button"
                  onClick={() => onSelectCompany(company.name)}
                  className="flex w-full items-center gap-3 rounded-lg py-3 text-left transition hover:bg-grey-50"
                >
                  <span className="w-5 text-center text-xs font-semibold text-grey-400">{index + 1}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-semibold text-brand-700">
                    {initialsOf(company.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-grey-900">{company.name}</span>
                    <span className="block text-xs text-grey-500">
                      {company.peopleCount} people · {company.totalEngagements} engagements
                    </span>
                    <span className="mt-2 block h-1.5 w-full rounded-full bg-grey-100">
                      <span
                        className="block h-1.5 rounded-full bg-brand-600"
                        style={{
                          width: `${maxCompanyPeople > 0 ? Math.max(6, Math.round((company.peopleCount / maxCompanyPeople) * 100)) : 0}%`,
                        }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
