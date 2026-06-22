const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010/api/v1';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;
  const token = sessionStorage.getItem('banquito_switch_access_token');
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.mensaje || errorData.message || `Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    return response.blob();
  }

  if (response.status === 204) return null;

  return response.text();
};
