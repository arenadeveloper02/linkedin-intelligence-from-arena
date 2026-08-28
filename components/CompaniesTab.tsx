"use client"

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { CompanyAggregate, SeniorityLevel } from '@/lib/types';
import { formatNumber, initialsOf, SENIORITY_ORDER } from '@/lib/utils';

interface CompaniesTabProps {
  companies: CompanyAggregate[];
  onSelectCompany: (name: string) => void;
}

const SEGMENT_COLORS: Record<SeniorityLevel, string> = {
  'C-Level': '#B364D7',
  Director: '#1A73E8',
  Manager: '#00A7D6',
  IC: '#6D717F',
  Unknown: '#C6C8CE',
};

const THRESHOLDS = [1, 2, 3, 5];

export default function CompaniesTab({ companies, onSelectCompany }: CompaniesTabProps) {
  const [search, setSearch] = useState('');
  const [minPeople, setMinPeople] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies.filter(
      (company) => company.peopleCount >= minPeople && (!query || company.name.toLowerCase().includes(query))
    );
  }, [companies, search, minPeople]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-grey-200 bg-white p-4 shadow-ds-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies…"
              className="w-full rounded-lg border border-grey-200 py-2 pl-9 pr-3 text-sm text-grey-900 placeholder:text-grey-400 focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-grey-600">Min people:</span>
            {THRESHOLDS.map((threshold) => (
              <button
                key={threshold}
                type="button"
                onClick={() => setMinPeople(threshold)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  minPeople === threshold
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-grey-200 text-grey-600 hover:border-grey-400'
                }`}
              >
                {threshold}+
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-grey-500">
            {filtered.length} of {companies.length} companies
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((company) => {
          const knownPeopleCount = company.people.length;
          const peopleLabel =
            company.peopleCount === knownPeopleCount
              ? `${formatNumber(company.peopleCount)} people`
              : `${formatNumber(knownPeopleCount)} of ${formatNumber(company.peopleCount)} people`;
          return (
            <button
              key={`${company.companyId}-${company.name}`}
              type="button"
              onClick={() => onSelectCompany(company.name)}
              className="rounded-xl border border-grey-200 bg-white p-5 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                  {initialsOf(company.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-grey-900">{company.name}</p>
                  <p className="text-xs text-grey-500">{peopleLabel} from this company</p>
                </div>
                {company.companyUrl && (
                  <ExternalLink className="h-4 w-4 shrink-0 text-grey-400" aria-label="Open company profile" />
                )}
              </div>
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-grey-100">
                {SENIORITY_ORDER.map((level) => {
                  const count = company.seniorityCounts[level];
                  if (count === 0 || knownPeopleCount === 0) return null;
                  return (
                    <div
                      key={level}
                      className="h-full"
                      style={{
                        width: `${(count / knownPeopleCount) * 100}%`,
                        backgroundColor: SEGMENT_COLORS[level],
                      }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
          No companies match the current filters.
        </div>
      )}
    </div>
  );
}
