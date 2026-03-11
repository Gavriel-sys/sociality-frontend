import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function authHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

type ApiEnvelope<T> = {
  data?: {
    data?: T;
  };
};

export function unwrapResponse<T>(res: ApiEnvelope<T>): T {
  return res.data?.data as T;
}
