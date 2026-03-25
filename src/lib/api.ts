// src/lib/api.ts

import axios, { type AxiosResponse } from "axios";
import { getToken } from "@/lib/session";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  console.log("🔗 API Request:", config.method?.toUpperCase(), config.url, {
    hasToken: !!token,
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear session
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("sociality-session-change"));
    }
    console.error(
      "🚨 API Error:",
      error.response?.status,
      error.response?.data?.message || error.message,
    );
    return Promise.reject(error);
  },
);

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
