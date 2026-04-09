import client from './client';
import { NutritionLog, NutritionLogCreate } from '../types';

export const getNutrition = async (date?: string) => {
  const params = date ? `?log_date=${date}` : '';
  const res = await client.get<NutritionLog[]>(`/nutrition${params}`);
  return res.data;
};

export const logNutrition = async (data: NutritionLogCreate) => {
  const res = await client.post<NutritionLog>('/nutrition', data);
  return res.data;
};

export const deleteNutrition = async (id: number) => {
  await client.delete(`/nutrition/${id}`);
};
