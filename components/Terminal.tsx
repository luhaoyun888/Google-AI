import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  isRunning: boolean;
  isPaused?: boolean;
}

// Fix: formatTime helper to avoid TS error with fractionalSecondDigits
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${timeStr}.${ms}`;
};

export const Terminal: React.FC<TerminalProps> = ({ logs, isRunning, isPaused }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-lg border border-slate-800 shadow-inner font-mono text-sm overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
                isPaused ? 'bg-amber-500' :
                isRunning ? 'bg-green-500 animate-pulse' : 
                'bg-slate-600'
            }`}></div>
            <span className={`font-semibold text-xs uppercase tracking-wider ${
                isPaused ? 'text-amber-500' : 'text-slate-400'
            }`}>
                {isPaused ? '运行时已暂停 (PAUSED)' : isRunning ? 'WASM 运行时活跃' : '运行时空闲'}
            </span>
        </div>
        <div className="text-xs text-slate-500">Go/Wazero 仿真</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {logs.length === 0 && (
            <div className="text-slate-600 italic text-center mt-10">等待执行...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <span className="text-slate-600 shrink-0">
              [{formatTime(log.timestamp)}]
            </span>
            <div className="flex-1 break-all">
                {log.source === 'SYSTEM' && <span className="text-blue-400 font-bold mr-2">[系统]</span>}
                {log.source === 'WASM_RUNTIME' && <span className="text-purple-400 font-bold mr-2">[内核]</span>}
                {log.source === 'PLUGIN' && <span className="text-yellow-400 font-bold mr-2">[插件]</span>}
                
                <span className={`${
                    log.type === 'ERROR' ? 'text-red-400' :
                    log.type === 'SUCCESS' ? 'text-green-400' :
                    log.type === 'WARN' ? 'text-orange-300' :
                    'text-slate-300'
                }`}>
                    {log.message}
                </span>
            </div>
          </div>
        ))}
        {isPaused && (
             <div className="py-2 text-center text-amber-500/50 text-xs italic border-t border-amber-500/10 mt-2">
                -- 执行已暂停 --
            </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};