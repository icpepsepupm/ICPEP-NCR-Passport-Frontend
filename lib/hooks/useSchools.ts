import { useState, useEffect, useCallback } from 'react';

export interface School {
  id: number;
  name: string;
  code: string;
  created_at?: string;
}

// Using safe centralized fetch wrapper with strict response validation
async function safeFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid API response: Expected JSON format. Received HTML or text.");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "API request failed");
  }

  return json.data;
}

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await safeFetch('/api/admin/schools');
      setSchools(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schools');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const createSchool = async (data: { name: string; code: string }) => {
    const result = await safeFetch('/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchSchools();
    return result;
  };

  const updateSchool = async (id: number, data: { name: string; code: string }) => {
    const result = await safeFetch(`/api/admin/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchSchools();
    return result;
  };

  const deleteSchool = async (id: number) => {
    await safeFetch(`/api/admin/schools/${id}`, {
      method: 'DELETE',
    });
    await fetchSchools();
  };

  return {
    schools,
    loading,
    error,
    refetch: fetchSchools,
    createSchool,
    updateSchool,
    deleteSchool
  };
}