const API_BASE = "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Error ${res.status}`);
  }

  return res.json();
}