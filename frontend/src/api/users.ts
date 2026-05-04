import client from './client';
import { User, UserUpdate } from '../types';

export const getMe = async () => {
  const res = await client.get<User>('/users/me');
  return res.data;
};

export const updateMe = async (data: UserUpdate) => {
  const res = await client.patch<User>('/users/me', data);
  return res.data;
};

export const exportMyData = async () => {
  const res = await client.get('/users/me/export');
  return res.data;
};

export const deleteMyAccount = async () => {
  await client.delete('/users/me');
};
