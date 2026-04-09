import client from './client';
import { User } from '../types';

export const register = async (email: string, password: string, name: string) => {
  const res = await client.post<User>('/auth/register', { email, password, name });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const res = await client.post<{ access_token: string; token_type: string; user: User }>(
    '/auth/login',
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data;
};
