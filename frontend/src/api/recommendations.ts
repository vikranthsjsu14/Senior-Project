import client from './client';
import { AIRecommendationResponse } from '../types';

export const generateRecommendations = async (type = 'full', forceRefresh = false) => {
  const res = await client.post<AIRecommendationResponse>('/ai/recommendations', {
    recommendation_type: type,
    force_refresh: forceRefresh,
  });
  return res.data;
};

export const getCachedRecommendations = async () => {
  const res = await client.get('/ai/recommendations');
  return res.data;
};
