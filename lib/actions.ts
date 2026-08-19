'use server';

import { prisma } from '@/lib/prisma';

export async function recordFetchLog(
  email: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.fetchLog.create({ data: { email, status } });
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to record fetch log' };
  }
}
