import { useState, useCallback } from 'react';

function useStorageUsage() {
  const [usageMB, setUsageMB] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);

  const calculateUsage = useCallback(async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 1; // Avoid division by zero
        
        const megabytes = usageBytes / (1024 * 1024);
        setUsageMB(megabytes);
        setUsagePercentage((usageBytes / quotaBytes) * 100);
      }
    } catch (error) {
      console.error("Could not estimate storage usage:", error);
      setUsageMB(0);
      setUsagePercentage(0);
    }
  }, []);

  return { usageMB, usagePercentage, refreshUsage: calculateUsage };
}

export default useStorageUsage;
