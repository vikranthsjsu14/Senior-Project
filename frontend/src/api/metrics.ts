import client from './client';
import { DailyMetrics, DailyMetricsCreate, SleepLog, SleepLogCreate } from '../types';

export const getDailyMetrics = async (days = 7) => {
  const res = await client.get<DailyMetrics[]>(`/metrics/daily?days=${days}`);
  return res.data;
};

export const getTodayMetrics = async () => {
  const res = await client.get<DailyMetrics | null>('/metrics/daily/today');
  return res.data;
};

export const logDailyMetrics = async (data: DailyMetricsCreate) => {
  const res = await client.post<DailyMetrics>('/metrics/daily', data);
  return res.data;
};

export const getSleepLogs = async (days = 7) => {
  const res = await client.get<SleepLog[]>(`/metrics/sleep?days=${days}`);
  return res.data;
};

export const logSleep = async (data: SleepLogCreate) => {
  const res = await client.post<SleepLog>('/metrics/sleep', data);
  return res.data;
};
