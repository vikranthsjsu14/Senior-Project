import client from './client';
import { Goal, GoalCreate } from '../types';

export const getGoals = async (includeCompleted = false) => {
  const res = await client.get<Goal[]>(`/goals?include_completed=${includeCompleted}`);
  return res.data;
};

export const createGoal = async (data: GoalCreate) => {
  const res = await client.post<Goal>('/goals', data);
  return res.data;
};

export const updateGoal = async (id: number, updates: Partial<{ current_value: number; is_completed: boolean }>) => {
  const res = await client.patch<Goal>(`/goals/${id}`, updates);
  return res.data;
};

export const deleteGoal = async (id: number) => {
  await client.delete(`/goals/${id}`);
};
