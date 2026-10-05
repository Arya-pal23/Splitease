const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('splitease_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data.error || `Request failed with status ${response.status}`;
    throw new Error(error);
  }

  return data;
}
