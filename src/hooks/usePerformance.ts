import { useMemo, useState, useEffect } from 'react';

// Cache semplice per i dati
const dataCache = new Map<string, any>();

// Hook per debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook per filtraggio veloce
export function useFastFilter<T>(
  data: T[],
  searchTerm: string,
  getLabel: (item: T) => string,
  cacheKey?: string
) {
  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  return useMemo(() => {
    const key = `${cacheKey}_${debouncedSearchTerm}`;
    
    if (dataCache.has(key)) {
      return dataCache.get(key);
    }

    if (!debouncedSearchTerm.trim()) {
      dataCache.set(key, data);
      return data;
    }

    const filtered = data.filter(item => 
      getLabel(item).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Limita cache
    if (dataCache.size > 30) {
      const firstKey = dataCache.keys().next().value;
      if (firstKey) {
        dataCache.delete(firstKey);
      }
    }

    dataCache.set(key, filtered);
    return filtered;
  }, [data, debouncedSearchTerm, getLabel, cacheKey]);
}

// Hook per caricare dati una sola volta
export function useOnceData<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Controlla cache
    if (dataCache.has(key) && !dependencies.some(dep => dep === undefined)) {
      setData(dataCache.get(key));
      setLoading(false);
      return;
    }

    fetcher()
      .then((result) => {
        setData(result);
        dataCache.set(key, result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [key, ...dependencies]);

  return { data, loading, error };
}

// Funzione per pulire cache
export function clearDataCache(pattern?: string) {
  if (pattern) {
    for (const [key] of dataCache) {
      if (key.includes(pattern)) {
        dataCache.delete(key);
      }
    }
  } else {
    dataCache.clear();
  }
}
