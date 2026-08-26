"use client"

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { decodeUnicodeEscapes } from '@/lib/utils';

interface AnalyzeLoadingProps {
  name?: string;
  variant?: 'analyze' | 'history';
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function AnalyzeLoading({ name, variant = 'analyze' }: AnalyzeLoadingProps) {
  const [elapsed, setElapsed] = useState(0);
  const label = name ? decodeUnicodeEscapes(name).trim() : '';
  const isHistory = variant === 'history';

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      <p className="mt-4 text-sm font-medium text-grey-700">
        {isHistory
          ? label
            ? `Opening saved analysis for ${label}…`
            : 'Opening saved analysis…'
          : label
            ? `Building intelligence for ${label}…`
            : 'Building intelligence…'}
      </p>
      <p className="mt-1 max-w-md text-xs text-grey-500">
        {isHistory
          ? 'Fetching the full dashboard for this profile. This usually takes a few seconds.'
          : 'Keep this tab open. Analysis often takes a few minutes, and the dashboard opens as soon as it finishes.'}
      </p>
      {!isHistory && (
        <p className="mt-3 text-[11px] tabular-nums text-grey-400">Elapsed {formatElapsed(elapsed)}</p>
      )}
    </main>
  );
}
