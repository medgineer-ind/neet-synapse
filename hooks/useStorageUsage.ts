import { useState, useCallback } from 'react';

// A conservative estimate of the localStorage limit in bytes (5MB)
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

function useStorageUsage() {
  const [usageMB, setUsageMB] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);

  const calculateUsage = useCallback(() => {
    let totalBytes = 0;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          if (value) {
            // Estimate size in bytes (UTF-16 characters are 2 bytes)
            totalBytes += (key.length + value.length) * 2;
          }
        }
      }
      
      const megabytes = totalBytes / (1024 * 1024);
      setUsageMB(megabytes);
      setUsagePercentage((totalBytes / STORAGE_LIMIT_BYTES) * 100);

    } catch (error) {
      console.error("Could not calculate storage usage:", error);
      setUsageMB(0);
      setUsagePercentage(0);
    }
  }, []);

  return { usageMB, usagePercentage, refreshUsage: calculateUsage };
}

export default useStorageUsage;
