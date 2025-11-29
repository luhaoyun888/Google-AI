
// 模拟内存管理器 pkg/memory

export class MemoryManager {
    private usedMemoryMB: number = 0;
    private maxMemoryMB: number;

    constructor(maxMemoryMB: number) {
        this.maxMemoryMB = maxMemoryMB;
    }

    public allocate(sizeMB: number): boolean {
        if (this.usedMemoryMB + sizeMB > this.maxMemoryMB) {
            return false;
        }
        this.usedMemoryMB += sizeMB;
        return true;
    }

    public free() {
        this.usedMemoryMB = 0;
    }

    public getStats() {
        return {
            used: this.usedMemoryMB,
            total: this.maxMemoryMB
        };
    }
    
    // 模拟从 Wasm 线性内存读取
    public safeRead(ptr: number, size: number): string {
        return `[HEX DATA @ 0x${ptr.toString(16)}]`;
    }
}
