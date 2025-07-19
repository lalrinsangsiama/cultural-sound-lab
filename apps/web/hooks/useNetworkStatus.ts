import { useState, useEffect } from 'react';

interface NetworkInformation {
  type?: string;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  downlink: number | null;
  effectiveType: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    downlink: null,
    effectiveType: null,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const status: NetworkStatus = {
        isOnline: navigator.onLine,
        isSlowConnection: false,
        connectionType: connection?.type || null,
        downlink: connection?.downlink || null,
        effectiveType: connection?.effectiveType || null,
      };

      // Detect slow connection
      if (connection) {
        const slowTypes = ['slow-2g', '2g'];
        const slowDownlink = connection.downlink < 1.5; // Less than 1.5 Mbps
        status.isSlowConnection = slowTypes.includes(connection.effectiveType) || slowDownlink;
      }

      setNetworkStatus(status);
    };

    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial check
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}