
import { WasmPlugin, SecurityPolicy, LogEntry, ActionType } from '../../types';
import { SandboxVerifier } from './sandbox';
import { MemoryManager } from './memory';

// 模拟的 Wasm 运行时核心
export async function* createRuntimeInstance(
    plugin: WasmPlugin,
    policy: SecurityPolicy,
    onWrite?: (path: string, content: string) => void
): AsyncGenerator<LogEntry> {
    
    const runId = Math.random().toString(36).substring(7);
    const sandbox = new SandboxVerifier(policy);
    const memory = new MemoryManager(policy.maxMemoryMB);

    // 1. 初始化阶段
    yield {
        id: `${runId}-init`,
        timestamp: Date.now(),
        type: 'INFO',
        source: 'SYSTEM',
        message: `[Runtime] 初始化 Wazero 引擎...`
    };

    // 2. 加载模块
    yield {
        id: `${runId}-load`,
        timestamp: Date.now() + 50,
        type: 'INFO',
        source: 'SYSTEM',
        message: `[Loader] 解析 Wasm 模块 (${plugin.size})`
    };

    // 3. 实例化与内存分配
    const baseMem = 10; // 基础开销
    if (!memory.allocate(baseMem)) {
         yield {
            id: `${runId}-oom-init`,
            timestamp: Date.now(),
            type: 'ERROR',
            source: 'WASM_RUNTIME',
            message: `[Memory] 实例化失败: 无法分配初始内存 ${baseMem}MB`
        };
        return;
    }

    yield {
        id: `${runId}-start`,
        timestamp: Date.now() + 100,
        type: 'INFO',
        source: 'SYSTEM',
        message: `[Runtime] 模块已启动. PID: ${runId}`
    };

    // 4. 执行指令循环
    for (const action of plugin.mockActions) {
        // 模拟 CPU 时间消耗
        await new Promise(resolve => setTimeout(resolve, action.delayMs || 500));

        // 内存分配检查 (如果是资源分配操作)
        if (action.type === ActionType.RESOURCE_ALLOC && action.target.startsWith('memory:')) {
            const reqMem = parseInt(action.target.split(':')[1]);
            const success = memory.allocate(reqMem);
            if (!success) {
                 yield {
                    id: `${runId}-${Date.now()}`,
                    timestamp: Date.now(),
                    type: 'ERROR',
                    source: 'WASM_RUNTIME',
                    message: `[Memory] 内存分配拒绝: 请求 ${reqMem}MB (当前已用 ${memory.getStats().used}MB)`
                };
                return; // OOM 崩溃
            } else {
                 yield {
                    id: `${runId}-${Date.now()}`,
                    timestamp: Date.now(),
                    type: 'INFO',
                    source: 'WASM_RUNTIME',
                    message: `[Memory] 堆扩展: +${reqMem}MB (总计: ${memory.getStats().used}/${memory.getStats().total}MB)`
                };
                continue;
            }
        }

        // 沙箱策略检查
        const check = sandbox.verifyAction(action);

        if (check.allowed) {
            // 执行副作用
            if (action.type === ActionType.FILE_WRITE && onWrite) {
                onWrite(action.target, `[二进制数据] ${plugin.name} (simulated)`);
            }

            yield {
                id: `${runId}-${Date.now()}`,
                timestamp: Date.now(),
                type: 'SUCCESS',
                source: 'PLUGIN',
                message: `[Syscall] ${action.type} -> ${action.target} [OK]`
            };
        } else {
            yield {
                id: `${runId}-${Date.now()}`,
                timestamp: Date.now(),
                type: 'ERROR',
                source: 'WASM_RUNTIME',
                message: `[Sandbox] 拦截违规操作: ${check.reason}`
            };
            
            // 某些违规可能导致终止? 暂时继续，除非是致命错误
        }
    }

    // 5. 清理
    memory.free();
    yield {
        id: `${runId}-end`,
        timestamp: Date.now(),
        type: 'INFO',
        source: 'SYSTEM',
        message: `[Runtime] 执行完毕. 资源已回收.`
    };
}
