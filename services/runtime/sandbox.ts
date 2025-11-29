
import { SecurityPolicy, ActionType, MockAction } from '../../types';

// Utility to match glob-like patterns
export const matchPattern = (pattern: string, target: string): boolean => {
  const p = pattern.replace(/\\/g, '/');
  const t = target.replace(/\\/g, '/');
  
  if (p === '*') return true;
  if (!p) return false;
  
  const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
  
  try {
    const regex = new RegExp(regexStr);
    return regex.test(t);
  } catch (e) {
    return false;
  }
};

export class SandboxVerifier {
    private policy: SecurityPolicy;

    constructor(policy: SecurityPolicy) {
        this.policy = policy;
    }

    public verifyAction(action: MockAction): { allowed: boolean; reason?: string } {
        switch (action.type) {
            case ActionType.FILE_READ:
                return this.checkFileAccess(action.target, this.policy.allowedReadPaths, '读取');
            case ActionType.FILE_WRITE:
                return this.checkFileAccess(action.target, this.policy.allowedWritePaths, '写入');
            case ActionType.NETWORK_CONNECT:
                return this.checkNetwork(action.target);
            case ActionType.SYS_ENV:
                return this.checkEnv();
            case ActionType.RESOURCE_ALLOC:
                return this.checkResource(action.target);
            default:
                return { allowed: true };
        }
    }

    private checkFileAccess(path: string, allowList: string[], opName: string) {
        const allowed = allowList.some(p => matchPattern(p, path));
        return allowed 
            ? { allowed: true } 
            : { allowed: false, reason: `${opName}拒绝: ${path} \n未匹配白名单: [${allowList.join(', ')}]` };
    }

    private checkNetwork(domain: string) {
        const allowed = this.policy.allowedDomains.some(d => matchPattern(d, domain));
        return allowed 
            ? { allowed: true } 
            : { allowed: false, reason: `网络连接拒绝: ${domain}` };
    }

    private checkEnv() {
        return this.policy.allowEnvAccess 
            ? { allowed: true } 
            : { allowed: false, reason: `环境变量访问被禁止` };
    }

    private checkResource(target: string) {
        if (target.startsWith('memory:')) {
            const reqMem = parseInt(target.split(':')[1]);
            return reqMem <= this.policy.maxMemoryMB 
              ? { allowed: true } 
              : { allowed: false, reason: `内存超限 (OOM): 请求 ${reqMem}MB > 限制 ${this.policy.maxMemoryMB}MB` };
        }
        if (target.startsWith('cpu:')) {
            const reqCpu = parseInt(target.split(':')[1]);
            return reqCpu <= this.policy.maxCpuTimeMs
              ? { allowed: true }
              : { allowed: false, reason: `CPU 超时: 执行时间 > ${this.policy.maxCpuTimeMs}ms` };
        }
        return { allowed: true };
    }
}