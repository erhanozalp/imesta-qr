export interface SerialPortStatus {
  status: 'listening' | 'error' | 'closed' | 'connecting';
  message: string;
  port: string;
}

export interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
  token?: string;
  customerName?: string;
  details?: string;
  operatorName?: string;
  operatorEmail?: string;
}

export interface ElectronAPI {
  getApiUrl: () => Promise<string>;
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  onWindowFocused: (callback: () => void) => void;
  onQRScanned: (callback: (token: string) => void) => void;
  onQRInvalid: (callback: (message: string) => void) => void;
  onWindowMinimized: (callback: () => void) => void;
  onSerialPortStatus: (callback: (status: SerialPortStatus) => void) => void;
  onAddLog: (callback: (log: LogEntry) => void) => void;
  onSerialPortLog: (callback: (log: { level: string; message: string; timestamp: string }) => void) => void;
  saveLogsToFile: (logs: LogEntry[]) => Promise<void>;
  scanForPort: () => Promise<{ success: boolean; port?: string; error?: string }>;
  getAvailablePorts: () => Promise<{ success: boolean; ports?: string[]; error?: string }>;
  setPort: (port: string) => Promise<{ success: boolean; error?: string }>;
  console: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}



