import type { ReactNode } from 'react';
import type { DistributionItem, SeniorityLevel } from '@/lib/types';
import { formatNumber, reactionEmoji } from '@/lib/utils';

const CHART_COLORS = ['#1A73E8', '#FB8145', '#B364D7', '#00A7D6', '#DFC612', '#F8528F', '#3BC884', '#6D717F'];

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-grey-200 bg-white p-4 shadow-ds-sm">
      <div className="flex items-center gap-2 text-grey-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-grey-900">{value}</p>
    </div>
  );
}

interface DistributionBarProps {
  title: string;
  items: DistributionItem[];
  maxItems?: number;
  emptyLabel?: string;
}

export function DistributionBar({ title, items, maxItems = 6, emptyLabel = 'No data available' }: DistributionBarProps) {
  const visible = items.slice(0, maxItems);
  const max = visible.reduce((m, item) => Math.max(m, item.count), 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="rounded-xl border border-grey-200 bg-white p-5 shadow-ds-sm">
      <h3 className="text-sm font-semibold text-grey-900">{title}</h3>
      {visible.length === 0 ? (
        <p className="mt-4 text-xs text-grey-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((item, index) => (
            <li key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-grey-700">{item.label}</span>
                <span className="ml-2 shrink-0 text-grey-500">
                  {formatNumber(item.count)} · {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-grey-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${max > 0 ? Math.max(4, Math.round((item.count / max) * 100)) : 0}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SENIORITY_STYLES: Record<SeniorityLevel, string> = {
  'C-Level': 'bg-purple-50 text-purple-700',
  Director: 'bg-brand-50 text-brand-700',
  Manager: 'bg-seablue-50 text-seablue-700',
  IC: 'bg-grey-100 text-grey-700',
  Unknown: 'bg-grey-50 text-grey-500',
};

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  'C-Level': 'C-Level',
  Director: 'Director',
  Manager: 'Manager',
  IC: 'IC',
  Unknown: 'Other',
};

export function SeniorityBadge({ level }: { level: SeniorityLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${SENIORITY_STYLES[level]}`}>
      {SENIORITY_LABELS[level]}
    </span>
  );
}

export function DecisionMakerBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-success-700 px-2 py-0.5 text-[11px] font-medium text-white">
      Decision Maker
    </span>
  );
}

export function CompanyBadge({ isInternal }: { isInternal: boolean }) {
  if (isInternal) {
    return (
      <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-700">
        P² Employee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700">
      External
    </span>
  );
}

export function ReactionBadge({ type }: { type: string }) {
  const normalized = type.trim().toUpperCase();
  const label = normalized ? normalized.charAt(0) + normalized.slice(1).toLowerCase() : 'Like';
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-grey-200 bg-grey-50 px-2 py-0.5 text-[11px] font-medium text-grey-700">
      <span>{reactionEmoji(normalized || 'LIKE')}</span>
      {label}
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-28 rounded-xl bg-grey-100" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-grey-100" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-56 rounded-xl bg-grey-100" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-grey-100" />
    </div>
  );
}
