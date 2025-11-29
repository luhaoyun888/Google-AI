export enum PluginLanguage {
  GO = 'Go',
  RUST = 'Rust',
  TYPESCRIPT = 'TypeScript (AssemblyScript)',
  PYTHON = 'Python',
}

export interface WasmPlugin {
  id: string;
  name: string;
  language: PluginLanguage;
  description: string;
  code: string; // The mock source code
  size: string;
  mockActions: MockAction[]; // Pre-defined actions this plugin tries to execute
  status?: 'active' | 'suspended'; // Lifecycle status
}

export enum ActionType {
  FILE_READ = 'FILE_READ',
  FILE_WRITE = 'FILE_WRITE',
  NETWORK_CONNECT = 'NETWORK_CONNECT',
  SYS_ENV = 'SYS_ENV',
  RESOURCE_ALLOC = 'RESOURCE_ALLOC',
}

export interface MockAction {
  type: ActionType;
  target: string; // e.g., "/etc/passwd" or "google.com"
  payload?: string;
  delayMs: number;
}

export interface SecurityPolicy {
  allowedReadPaths: string[];
  allowedWritePaths: string[];
  allowedDomains: string[];
  maxMemoryMB: number;
  maxCpuTimeMs: number;
  allowEnvAccess: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  source: 'SYSTEM' | 'PLUGIN' | 'WASM_RUNTIME';
}

export interface AnalysisResult {
  riskScore: number;
  summary: string;
  vulnerabilities: string[];
}