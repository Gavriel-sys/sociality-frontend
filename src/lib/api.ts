import axios, { type AxiosResponse } from "axios";
import { getToken } from "@/lib/session";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function authHeaders() {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function unwrapResponse<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  return res.data.data;
}
