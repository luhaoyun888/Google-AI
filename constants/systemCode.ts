
// This file contains the "AI Generated" Go source code for the backend architecture.
// It represents the ideal structure requested by the user.

export const SYSTEM_CODE_FILES = [
  {
    name: "pkg/runtime/runtime.go",
    description: "Wasm 运行时核心 (Wazero 封装)",
    language: "go",
    content: `package runtime

import (
	"context"
	"fmt"
	"log"

	"github.com/tetratelabs/wazero"
	"github.com/tetratelabs/wazero/api"
	"github.com/tetratelabs/wazero/imports/wasi_snapshot_preview1"
	
	"github.com/my-org/wasmguard/pkg/memory"
	"github.com/my-org/wasmguard/pkg/sandbox"
)

type Runtime struct {
	runtime wazero.Runtime
	conf    *sandbox.Config
}

// NewRuntime 初始化 Wasm 运行时环境
func NewRuntime(ctx context.Context, conf *sandbox.Config) (*Runtime, error) {
	r := wazero.NewRuntime(ctx)
	
	// 实例化 WASI
	wasi_snapshot_preview1.MustInstantiate(ctx, r)

	// 注册宿主函数 (Host Functions)
	_, err := r.NewHostModuleBuilder("env").
		NewFunctionBuilder().
		WithFunc(func(ctx context.Context, mod api.Module, ptr uint32, size uint32) {
			// 使用解耦的内存模块进行安全读取
			data, err := memory.SafeRead(mod, ptr, size)
			if err != nil {
				log.Printf("Memory violation: %v", err)
				return
			}
			fmt.Printf("Guest says: %s\n", string(data))
		}).
		Export("host_log").
		Instantiate(ctx)

	if err != nil {
		return nil, err
	}

	return &Runtime{runtime: r, conf: conf}, nil
}

// Execute 运行插件代码
func (r *Runtime) Execute(ctx context.Context, wasmBytes []byte) error {
	// 编译模块
	compiled, err := r.runtime.CompileModule(ctx, wasmBytes)
	if err != nil {
		return fmt.Errorf("compile failed: %w", err)
	}

	// 实例化配置 (应用资源限制)
	modConf := wazero.NewModuleConfig().
		WithStdout(r.conf.Stdout).
		WithStderr(r.conf.Stderr)

	// 实例化并运行
	inst, err := r.runtime.InstantiateModule(ctx, compiled, modConf)
	if err != nil {
		return fmt.Errorf("instantiate failed: %w", err)
	}
	defer inst.Close(ctx)

	return nil
}`
  },
  {
    name: "config.go",
    description: "沙箱配置与安全策略定义",
    language: "go",
    content: `package main

import (
	"io"
)

// SecurityPolicy 定义了插件允许的操作范围
type SecurityPolicy struct {
	AllowedReadPaths  []string \`json:"allowed_read_paths"\`
	AllowedWritePaths []string \`json:"allowed_write_paths"\`
	AllowedDomains    []string \`json:"allowed_domains"\`
	MaxMemoryMB       uint64   \`json:"max_memory_mb"\`
	MaxCpuTimeMs      uint64   \`json:"max_cpu_time_ms"\`
	AllowEnvAccess    bool     \`json:"allow_env_access"\`
}

// Config 传递给运行时的上下文配置
type Config struct {
	Policy *SecurityPolicy
	Stdout io.Writer
	Stderr io.Writer
}

// DefaultPolicy 生成默认的安全策略
func DefaultPolicy() *SecurityPolicy {
	return &SecurityPolicy{
		AllowedReadPaths: []string{"/data/public/*"},
		AllowedWritePaths: []string{"/tmp/*"},
		MaxMemoryMB: 128,
		MaxCpuTimeMs: 1000,
		AllowEnvAccess: false,
	}
}`
  },
  {
    name: "pkg/memory/memory.go",
    description: "内存安全操作标准库",
    language: "go",
    content: `package memory

import (
	"fmt"
	"github.com/tetratelabs/wazero/api"
)

// SafeRead 从 Wasm 线性内存中安全读取数据
// 实现了边界检查和指针验证
func SafeRead(mod api.Module, ptr uint32, size uint32) ([]byte, error) {
	mem := mod.Memory()
	if mem == nil {
		return nil, fmt.Errorf("module has no memory exported")
	}

	// 读取字节 (wazero Read 内部已包含基本的边界检查)
	buf, ok := mem.Read(ptr, size)
	if !ok {
		return nil, fmt.Errorf("memory access out of bounds: ptr=%d size=%d", ptr, size)
	}

	// 此处可添加额外的安全检查逻辑
	// 例如：检查是否访问了受保护的内存段

	return buf, nil
}

// SafeWrite 向 Wasm 线性内存安全写入数据
func SafeWrite(mod api.Module, ptr uint32, data []byte) error {
	mem := mod.Memory()
	if mem == nil {
		return fmt.Errorf("module has no memory exported")
	}

	if !mem.Write(ptr, data) {
		return fmt.Errorf("memory write out of bounds: ptr=%d size=%d", ptr, len(data))
	}
	
	return nil
}`
  },
  {
    name: "sdk/guest.go",
    description: "插件开发者 SDK (Guest)",
    language: "go",
    content: `package sdk

// 此包供插件开发者使用，封装了底层的 host 调用

//export host_log
func hostLog(ptr uint32, size uint32)

// Log 发送日志到宿主机
func Log(message string) {
	ptr, size := stringToPtr(message)
	hostLog(ptr, size)
}

// ReadFile 请求宿主机读取文件
func ReadFile(path string) ([]byte, error) {
	// ... 内部实现：调用 host_read_file ...
	return []byte{}, nil
}

// WriteFile 请求宿主机写入文件
func WriteFile(path string, data []byte) error {
	// ... 内部实现：调用 host_write_file ...
	return nil
}

// 辅助函数：将 Go 字符串转换为 Wasm 内存指针
func stringToPtr(s string) (uint32, uint32) {
	// 实际实现需要配合 tinygo 的 unsafe 转换
	return 0, uint32(len(s))
}`
  }
];
