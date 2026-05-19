'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Tracks how many image uploads are in progress anywhere in the admin panel.
 * Save buttons read `isUploading` so they stay disabled until every upload
 * has finished.
 */
const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [count, setCount] = useState(0);

  const beginUpload = useCallback(() => setCount(c => c + 1), []);
  const endUpload = useCallback(() => setCount(c => (c > 0 ? c - 1 : 0)), []);

  const value = useMemo(
    () => ({ isUploading: count > 0, beginUpload, endUpload }),
    [count, beginUpload, endUpload]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload() {
  return (
    useContext(UploadContext) || {
      isUploading: false,
      beginUpload: () => {},
      endUpload: () => {},
    }
  );
}
