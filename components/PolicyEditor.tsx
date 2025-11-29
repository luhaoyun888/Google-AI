import React from 'react';
import { SecurityPolicy } from '../types';
import { ShieldCheck, Server, Globe, Cpu } from 'lucide-react';

interface PolicyEditorProps {
  policy: SecurityPolicy;
  onChange: (policy: SecurityPolicy) => void;
  disabled: boolean;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ policy, onChange, disabled }) => {
  
  const handleArrayChange = (key: keyof SecurityPolicy, value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    onChange({ ...policy, [key]: arr });
  };

  const handleChange = (key: keyof SecurityPolicy, value: any) => {
    onChange({ ...policy, [key]: value });
  };

  return (
    <div className="space-y-6 p-4">
      
      {/* File System */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 文件系统访问
        </h3>
        <div className="grid gap-3">
            <div>
                <label className="block text-xs text-slate-500 mb-1">允许读取路径 (Glob)</label>
                <input 
                    type="text" 
                    disabled={disabled}
                    value={policy.allowedReadPaths.join(', ')}
                    onChange={(e) => handleArrayChange('allowedReadPaths', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    placeholder="/data/*, ./config.json"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">允许写入路径 (Glob)</label>
                <input 
                    type="text" 
                    disabled={disabled}
                    value={policy.allowedWritePaths.join(', ')}
                    onChange={(e) => handleArrayChange('allowedWritePaths', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    placeholder="/tmp/*"
                />
            </div>
        </div>
      </div>

      {/* Network */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> 网络
        </h3>
        <div>
            <label className="block text-xs text-slate-500 mb-1">允许域名/IP</label>
            <input 
                type="text" 
                disabled={disabled}
                value={policy.allowedDomains.join(', ')}
                onChange={(e) => handleArrayChange('allowedDomains', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                placeholder="api.google.com, 127.0.0.1"
            />
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" /> 资源限制
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs text-slate-500 mb-1">最大内存 (MB)</label>
                <input 
                    type="number" 
                    disabled={disabled}
                    value={policy.maxMemoryMB}
                    onChange={(e) => handleChange('maxMemoryMB', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-50"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">最大 CPU 时间 (ms)</label>
                <input 
                    type="number" 
                    disabled={disabled}
                    value={policy.maxCpuTimeMs}
                    onChange={(e) => handleChange('maxCpuTimeMs', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-50"
                />
            </div>
        </div>
      </div>

       {/* System */}
       <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-orange-400" /> 系统
        </h3>
        <div className="flex items-center gap-3">
            <input 
                type="checkbox"
                id="env-vars"
                disabled={disabled}
                checked={policy.allowEnvAccess}
                onChange={(e) => handleChange('allowEnvAccess', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="env-vars" className="text-sm text-slate-300">允许环境变量访问</label>
        </div>
      </div>

    </div>
  );
};