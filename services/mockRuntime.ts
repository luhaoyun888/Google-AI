import { WasmPlugin, SecurityPolicy, LogEntry, ActionType, MockAction } from '../types';

// Utility to match glob-like patterns using Regex for better accuracy
export const matchPattern = (pattern: string, target: string): boolean => {
  // Normalize slashes
  const p = pattern.replace(/\\/g, '/');
  const t = target.replace(/\\/g, '/');
  
  if (p === '*') return true;
  if (!p) return false;
  
  // Escape special regex characters except *
  const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Convert * to .*
  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
  
  try {
    const regex = new RegExp(regexStr);
    return regex.test(t);
  } catch (e) {
    console.warn(`Invalid glob pattern: ${pattern}`, e);
    return false;
  }
};

// Check if an action violates the policy
export const checkPolicy = (action: MockAction, policy: SecurityPolicy): { allowed: boolean; reason?: string } => {
  switch (action.type) {
    case ActionType.FILE_READ:
      const canRead = policy.allowedReadPaths.some(p => matchPattern(p, action.target));
      return canRead 
        ? { allowed: true } 
        : { allowed: false, reason: `读取拒绝 (Read Denied): ${action.target} \n未匹配任何允许路径: [${policy.allowedReadPaths.join(', ')}]` };

    case ActionType.FILE_WRITE:
      const canWrite = policy.allowedWritePaths.some(p => matchPattern(p, action.target));
      return canWrite 
        ? { allowed: true } 
        : { allowed: false, reason: `写入拒绝 (Write Denied): ${action.target} \n未匹配任何允许路径: [${policy.allowedWritePaths.join(', ')}]` };

    case ActionType.NETWORK_CONNECT:
      const canConnect = policy.allowedDomains.some(d => matchPattern(d, action.target));
      return canConnect 
        ? { allowed: true } 
        : { allowed: false, reason: `网络拒绝 (Network Denied): ${action.target}` };

    case ActionType.SYS_ENV:
      return policy.allowEnvAccess 
        ? { allowed: true } 
        : { allowed: false, reason: `环境变量访问被拒绝 (Env Access Denied)` };

    case ActionType.RESOURCE_ALLOC:
      if (action.target.startsWith('memory:')) {
        const reqMem = parseInt(action.target.split(':')[1]);
        return reqMem <= policy.maxMemoryMB 
          ? { allowed: true } 
          : { allowed: false, reason: `内存溢出 (OOM): 请求 ${reqMem}MB > 限制 ${policy.maxMemoryMB}MB` };
      }
      if (action.target.startsWith('cpu:')) {
        const reqCpu = parseInt(action.target.split(':')[1]);
        return reqCpu <= policy.maxCpuTimeMs
          ? { allowed: true }
          : { allowed: false, reason: `CPU 超时 (Timeout): 执行时间 > ${policy.maxCpuTimeMs}ms` };
      }
      return { allowed: true };
      
    default:
      return { allowed: true };
  }
};

// Generate a log stream based on plugin actions and policy
export async function* runPluginSimulation(
  plugin: WasmPlugin, 
  policy: SecurityPolicy,
  onWrite?: (path: string, content: string) => void
): AsyncGenerator<LogEntry> {
  const runId = Math.random().toString(36).substring(7);
  
  yield {
    id: `${runId}-start`,
    timestamp: Date.now(),
    type: 'INFO',
    source: 'SYSTEM',
    message: `正在初始化 Wasm 运行时 (Go/Wazero)... 加载中 ${plugin.name}.wasm [${plugin.size}]`
  };

  yield {
    id: `${runId}-load`,
    timestamp: Date.now() + 100,
    type: 'INFO',
    source: 'SYSTEM',
    message: `模块已实例化。正在应用沙箱策略...`
  };

  for (const action of plugin.mockActions) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 600)); 

    const check = checkPolicy(action, policy);

    if (check.allowed) {
      // Simulate side effects
      if (action.type === ActionType.FILE_WRITE && onWrite) {
        onWrite(action.target, `[模拟二进制数据] 由 ${plugin.name} 生成`);
      }

      yield {
        id: `${runId}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'SUCCESS',
        source: 'PLUGIN',
        message: `系统调用_成功 (Syscall Allowed): ${action.type} -> ${action.target}`
      };
    } else {
      yield {
        id: `${runId}-${Date.now()}`,
        timestamp: Date.now(),
        type: 'ERROR',
        source: 'WASM_RUNTIME',
        message: `系统调用_拦截 (Syscall Blocked): ${check.reason}`
      };
      
      // If it's a critical error (like memory), maybe we stop?
      if (action.type === ActionType.RESOURCE_ALLOC) {
         yield {
          id: `${runId}-crash`,
          timestamp: Date.now() + 50,
          type: 'ERROR',
          source: 'SYSTEM',
          message: `运行时崩溃: 插件因资源违规而终止。`
        };
        return; // Stop execution
      }
    }
  }

  yield {
    id: `${runId}-end`,
    timestamp: Date.now(),
    type: 'INFO',
    source: 'SYSTEM',
    message: `执行结束。内存已释放。`
  };
}