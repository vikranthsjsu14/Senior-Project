import client from './client';
import { DashboardSummary } from '../types';

export const getDashboardSummary = async () => {
  const res = await client.get<DashboardSummary>('/dashboard/summary');
  return res.data;
};

export const syncWearable = async () => {
  const res = await client.post<{ synced_days: string[]; message: string }>('/wearable/sync');
  return res.data;
};
