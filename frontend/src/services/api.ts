import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

type ApiEnvelope<T> = {
  status?: 'success' | 'error';
  data?: T;
  message?: string;
};

// แชร์ instance เพื่อให้ทุก request ใช้ base URL และ interceptors ชุดเดียวกัน
export const api = axios.create({ baseURL: 'http://localhost:5000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>;
    if (envelope.status === 'error') {
      return Promise.reject(new Error(envelope.message ?? 'API request failed'));
    }
    return envelope.data as unknown as typeof response;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const message = error.response?.data?.message ?? error.message;
    return Promise.reject(new Error(message));
  },
);

// คง helper ไว้เพื่อรองรับ service เดิม โดยส่ง request ผ่าน Axios instance
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  const response = await api.request<T>({
    url: endpoint,
    method: options.method,
    headers,
    data: options.body,
    signal: options.signal,
  } as AxiosRequestConfig<T>);

  // Axios types ไม่ทราบว่า response interceptor คืน data ที่แกะ envelope แล้ว
  return response as unknown as T;
}

export default api;
