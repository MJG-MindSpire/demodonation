export type ApiError = {
  message: string;
  status: number;
};

function getAuthToken() {
  return sessionStorage.getItem("impactflow.token");
}

const API_BASE =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:5003"
    : "";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData) && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = /^(https?:)?\/\//i.test(path) ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = (data && typeof data === "object" && "message" in data && typeof (data as any).message === "string")
      ? (data as any).message
      : `Request failed (${res.status})`;
    const err: ApiError = { message, status: res.status };
    throw err;
  }

  return data as T;
}

export async function apiJson<T>(path: string, body: unknown, init: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: init.method ?? "POST",
    body: JSON.stringify(body),
  });
}

export async function apiForm<T>(path: string, form: FormData, init: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: init.method ?? "POST",
    body: form,
  });
}
