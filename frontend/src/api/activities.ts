import client from './client';
import { Activity, ActivityCreate } from '../types';

export const getActivities = async (limit = 20) => {
  const res = await client.get<Activity[]>(`/activities?limit=${limit}`);
  return res.data;
};

export const logActivity = async (data: ActivityCreate) => {
  const res = await client.post<Activity>('/activities', data);
  return res.data;
};

export const deleteActivity = async (id: number) => {
  await client.delete(`/activities/${id}`);
};
