import React from 'react';
import { WasmPlugin } from '../types';
import { Info, Activity, Box, FileCode, Cpu, Layers } from 'lucide-react';

interface PluginDetailsProps {
  plugin: WasmPlugin;
}

export const PluginDetails: React.FC<PluginDetailsProps> = ({ plugin }) => {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300 h-full overflow-y-auto">
      
      {/* Basic Info Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
            <Info className="w-4 h-4" /> 插件元数据 (Metadata)
        </h3>
        
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        {plugin.name}
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono font-normal">
                            {plugin.id}
                        </span>
                    </h2>
                    <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">{plugin.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    plugin.language === 'Go' ? 'bg-cyan-500/10 text-cyan-400' : 
                    plugin.language === 'Rust' ? 'bg-orange-500/10 text-orange-400' : 
                    'bg-blue-500/10 text-blue-400'
                }`}>
                    <Box className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-800 pt-6">
                <div>
                    <span className="text-xs text-slate-500 block mb-1">编程语言</span>
                    <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
                        <FileCode className="w-4 h-4 text-slate-500" />
                        {plugin.language}
                    </div>
                </div>
                <div>
                    <span className="text-xs text-slate-500 block mb-1">二进制大小</span>
                    <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
                        <Cpu className="w-4 h-4 text-slate-500" />
                        {plugin.size}
                    </div>
                </div>
                <div>
                    <span className="text-xs text-slate-500 block mb-1">预设调用数</span>
                    <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
                        <Layers className="w-4 h-4 text-slate-500" />
                        {plugin.mockActions.length} Ops
                    </div>
                </div>
                 <div>
                    <span className="text-xs text-slate-500 block mb-1">完整性校验 (Mock)</span>
                    <div className="text-xs font-mono text-slate-400 truncate opacity-70">
                        sha256:e3b0c442...
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Syscalls Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-4 h-4" /> 预设调用序列 (Call Sequence)
        </h3>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-3 font-medium w-16">#</th>
                            <th className="px-6 py-3 font-medium">操作类型 (Opcode)</th>
                            <th className="px-6 py-3 font-medium">目标资源 (Target)</th>
                            <th className="px-6 py-3 font-medium text-right">模拟耗时</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {plugin.mockActions.map((action, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
                                        action.type.includes('READ') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        action.type.includes('WRITE') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        action.type.includes('NETWORK') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        action.type.includes('ENV') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-slate-700/50 text-slate-300 border-slate-600'
                                    }`}>
                                        {action.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                                    {action.target}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                                    {action.delayMs}ms
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {plugin.mockActions.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">
                    此插件未定义任何外部系统调用。
                </div>
            )}
        </div>
      </section>

      <div className="h-10"></div>
    </div>
  );
};