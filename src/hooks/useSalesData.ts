import { useState, useCallback, useEffect } from 'react';
import { parseRawData, DEFAULT_RAW_DATA } from '@/utils/dataParser';
import type { ParsedData } from '@/utils/dataParser';

const STORAGE_KEY = 'sales_dashboard_raw_data_v2';
const STORAGE_TIMESTAMP = 'sales_dashboard_timestamp_v2';

function loadSavedData(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveData(raw: string) {
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    localStorage.setItem(STORAGE_TIMESTAMP, new Date().toISOString());
  } catch {
    // localStorage might be full or unavailable
  }
}

export function useSalesData() {
  const saved = loadSavedData();
  const [rawText, setRawText] = useState(saved || DEFAULT_RAW_DATA);
  const [parsedData, setParsedData] = useState<ParsedData>(() => parseRawData(saved || DEFAULT_RAW_DATA));
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_TIMESTAMP) || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  });

  const applyData = useCallback((text: string) => {
    setRawText(text);
    const parsed = parseRawData(text);
    setParsedData(parsed);
    saveData(text);
    setLastUpdated(new Date().toISOString());
    setIsInputOpen(false);
  }, []);

  const resetToDefault = useCallback(() => {
    setRawText(DEFAULT_RAW_DATA);
    const parsed = parseRawData(DEFAULT_RAW_DATA);
    setParsedData(parsed);
    saveData(DEFAULT_RAW_DATA);
    setLastUpdated(new Date().toISOString());
  }, []);

  // Initial parse on mount
  useEffect(() => {
    if (saved) {
      const parsed = parseRawData(saved);
      setParsedData(parsed);
    }
  }, []);

  return {
    rawText,
    parsedData,
    isInputOpen,
    setIsInputOpen,
    applyData,
    resetToDefault,
    lastUpdated
  };
}
