import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from './components/Terminal';
import { PolicyEditor } from './components/PolicyEditor';
import { FileSystemViewer } from './components/FileSystemViewer';
import { PluginDetails } from './components/PluginDetails';
import { PluginForm } from './components/PluginForm';
import { SAMPLE_PLUGINS, DEFAULT_POLICY, INITIAL_FILES } from './constants';
import { WasmPlugin, SecurityPolicy, LogEntry, AnalysisResult } from './types';
import { runPluginSimulation } from './services/mockRuntime';
import { analyzePluginSecurity } from './services/geminiService';
import { Play, RotateCcw, ShieldAlert, Cpu, Code, Lock, Terminal as TerminalIcon, Sparkles, FolderOpen, FileBadge, Pause, Search, Plus, Trash2, Edit2, Power, Save } from 'lucide-react';

export default function App() {
  // Plugin Data State (CRUD)
  const [plugins, setPlugins] = useState<WasmPlugin[]>(SAMPLE_PLUGINS);
  const [selectedPlugin, setSelectedPlugin] = useState<WasmPlugin>(SAMPLE_PLUGINS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<WasmPlugin | null>(null);

  // Runtime State
  const [policy, setPolicy] = useState<SecurityPolicy>(DEFAULT_POLICY);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false); // Ref for the async generator loop to check
  const [activeTab, setActiveTab] = useState<'code' | 'policy' | 'files' | 'details'>('policy');
  
  // Virtual File System State
  const [virtualFiles, setVirtualFiles] = useState<Record<string, string>>(INITIAL_FILES);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Sync ref
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // CRUD Operations
  const handleAddPlugin = () => {
    setEditingPlugin(null);
    setIsFormOpen(true);
  };

  const handleEditPlugin = (plugin: WasmPlugin, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlugin(plugin);
    setIsFormOpen(true);
  };

  const handleDeletePlugin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (plugins.length <= 1) return; // Prevent deleting the last one
    
    const newPlugins = plugins.filter(p => p.id !== id);
    setPlugins(newPlugins);
    
    if (selectedPlugin.id === id) {
      setSelectedPlugin(newPlugins[0]);
      resetEnvironment();
    }
  };

  const handleToggleStatus = (plugin: WasmPlugin, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = plugin.status === 'suspended' ? 'active' : 'suspended';
    const updatedPlugin = { ...plugin, status: newStatus };
    setPlugins(plugins.map(p => p.id === plugin.id ? updatedPlugin as WasmPlugin : p));
    if (selectedPlugin.id === plugin.id) {
        setSelectedPlugin(updatedPlugin as WasmPlugin);
    }
  };

  const handleSavePlugin = (plugin: WasmPlugin) => {
    if (editingPlugin) {
      // Update
      setPlugins(plugins.map(p => p.id === plugin.id ? plugin : p));
      if (selectedPlugin.id === plugin.id) {
        setSelectedPlugin(plugin);
      }
    } else {
      // Create
      setPlugins([...plugins, plugin]);
      setSelectedPlugin(plugin);
    }
  };

  const handleUpdateCode = (code: string) => {
      const updated = { ...selectedPlugin, code };
      setSelectedPlugin(updated);
      setPlugins(plugins.map(p => p.id === updated.id ? updated : p));
  };

  // Environment Logic
  const resetEnvironment = () => {
    setLogs([]);
    setAnalysis(null);
    setVirtualFiles({ ...INITIAL_FILES });
    setIsPaused(false);
    pausedRef.current = false;
  };

  const handleRun = async () => {
    if (isRunning || selectedPlugin.status === 'suspended') return;
    
    setLogs([]); 
    setIsRunning(true);
    setIsPaused(false);
    setAnalysis(null);

    const onWrite = (path: string, content: string) => {
        setVirtualFiles(prev => ({
            ...prev,
            [path]: content
        }));
    };

    const generator = runPluginSimulation(selectedPlugin, policy, onWrite);
    
    try {
      for await (const log of generator) {
        // Pause Logic: Wait while paused
        while (pausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        setLogs(prev => [...prev, log]);
      }
    } finally {
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzePluginSecurity(selectedPlugin, policy);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // Filter plugins
  const filteredPlugins = plugins.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      
      {/* Plugin Form Modal */}
      <PluginForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingPlugin}
        onSave={handleSavePlugin}
      />

      {/* Sidebar / Plugin Manager */}
      <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-10">
        <div className="p-4 border-b border-slate-800">
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                WasmGuard
            </h1>
            <p className="text-xs text-slate-500 mt-1">运行时控制器</p>
        </div>
        
        {/* Search & Add Actions */}
        <div className="p-3 space-y-3">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="查找插件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
            </div>
            <button 
                onClick={handleAddPlugin}
                className="w-full py-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-medium text-slate-300 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" /> 添加插件 (Add Plugin)
            </button>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2 flex justify-between">
                <span>已加载 ({plugins.length})</span>
            </h2>
            <div className="space-y-1">
                {filteredPlugins.map(plugin => {
                    const isActive = selectedPlugin.id === plugin.id;
                    const isSuspended = plugin.status === 'suspended';
                    return (
                    <div
                        key={plugin.id}
                        className={`group relative rounded-md transition-all border ${
                            isActive 
                            ? 'bg-slate-800/80 border-slate-700 shadow-sm' 
                            : 'border-transparent hover:bg-slate-800/30'
                        } ${isSuspended ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                         <button
                            onClick={() => {
                                if (!isRunning) {
                                    setSelectedPlugin(plugin);
                                    resetEnvironment();
                                }
                            }}
                            className="w-full text-left px-3 py-3 flex items-start gap-3"
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isSuspended ? 'bg-slate-500' : plugin.language === 'Go' ? 'bg-cyan-500' : plugin.language === 'Rust' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm flex items-center gap-2">
                                    <span className="truncate">{plugin.name}</span>
                                    {isSuspended && <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded">暂停</span>}
                                </div>
                                <div className="text-[10px] opacity-70 mt-0.5 truncate">{plugin.language} • {plugin.size}</div>
                            </div>
                        </button>
                        
                        {/* Hover Actions */}
                        <div className={`absolute right-2 top-2.5 flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity bg-slate-900/80 rounded backdrop-blur-sm`}>
                             <button onClick={(e) => handleToggleStatus(plugin, e)} className="p-1 hover:text-amber-400 text-slate-500" title={isSuspended ? "恢复 (Resume)" : "暂停 (Pause)"}>
                                <Power className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleEditPlugin(plugin, e)} className="p-1 hover:text-blue-400 text-slate-500" title="编辑 (Edit)">
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleDeletePlugin(plugin.id, e)} className="p-1 hover:text-red-400 text-slate-500" title="卸载 (Unload)">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )})}
                {filteredPlugins.length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-xs">无匹配插件</div>
                )}
            </div>
        </div>

        {/* Footer Status */}
        <div className="mt-auto p-4 border-t border-slate-800">
             <div className="text-xs text-slate-600">
                <div className="flex justify-between mb-1">
                    <span>后端状态</span>
                    <span className="text-emerald-500">已连接 (gRPC)</span>
                </div>
                <div className="flex justify-between">
                    <span>运行时</span>
                    <span>wazero (Go)</span>
                </div>
             </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-925">
        
        {/* Top Bar */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
                 <h2 className="font-semibold text-slate-200">{selectedPlugin.name}</h2>
                 <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {selectedPlugin.id}
                 </span>
                 {selectedPlugin.status === 'suspended' && (
                     <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                         <ShieldAlert className="w-3 h-3" /> 已暂停 (Suspended)
                     </span>
                 )}
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded-md text-sm font-medium transition-all disabled:opacity-50"
                >
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gemini 审计
                </button>
                
                <div className="h-6 w-px bg-slate-700 mx-2"></div>

                <button 
                    onClick={resetEnvironment}
                    disabled={isRunning && !isPaused}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="重置环境"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                
                {isRunning && (
                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm shadow-lg transition-all border ${
                            isPaused
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                            : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        }`}
                    >
                        {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                        {isPaused ? '继续' : '暂停'}
                    </button>
                )}

                {!isRunning && (
                    <button 
                        onClick={handleRun}
                        disabled={isRunning || selectedPlugin.status === 'suspended'}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm shadow-lg transition-all ${
                            selectedPlugin.status === 'suspended'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                        }`}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        运行插件
                    </button>
                )}
            </div>
        </div>

        {/* Middle Area: Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left Panel: Configuration & Code */}
            <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-925 relative min-w-0">
                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('policy')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'policy' 
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Lock className="w-4 h-4" /> 策略控制
                    </button>
                    <button 
                         onClick={() => setActiveTab('files')}
                         className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'files' 
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <FolderOpen className="w-4 h-4" /> 文件系统
                    </button>
                    <button 
                         onClick={() => setActiveTab('code')}
                         className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'code' 
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Code className="w-4 h-4" /> 源码查看
                    </button>
                    <button 
                         onClick={() => setActiveTab('details')}
                         className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'details' 
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <FileBadge className="w-4 h-4" /> 插件详情
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'policy' && (
                         <PolicyEditor policy={policy} onChange={setPolicy} disabled={isRunning} />
                    )}
                    {activeTab === 'files' && (
                        <FileSystemViewer files={virtualFiles} />
                    )}
                    {activeTab === 'code' && (
                        <div className="relative h-full flex flex-col">
                            <textarea
                                value={selectedPlugin.code}
                                onChange={(e) => handleUpdateCode(e.target.value)}
                                disabled={isRunning}
                                spellCheck={false}
                                className="flex-1 p-4 text-xs font-mono text-slate-300 leading-relaxed bg-slate-925 resize-none focus:outline-none focus:bg-slate-900 transition-colors"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-500 rounded border border-slate-700">
                                    可编辑 (Editable)
                                </span>
                            </div>
                        </div>
                    )}
                    {activeTab === 'details' && (
                        <PluginDetails plugin={selectedPlugin} />
                    )}
                </div>

                {/* Analysis Overlay Result */}
                {analysis && (
                    <div className="border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur-sm animate-in slide-in-from-bottom-5 absolute bottom-0 w-full z-30">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${analysis.riskScore > 50 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 flex justify-between">
                                    Gemini 安全分析
                                    <span className={`${analysis.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
                                        风险评分: {analysis.riskScore}/100
                                    </span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 mb-2">{analysis.summary}</p>
                                {analysis.vulnerabilities.length > 0 && (
                                    <ul className="space-y-1">
                                        {analysis.vulnerabilities.map((v, i) => (
                                            <li key={i} className="text-xs flex items-center gap-2 text-slate-300">
                                                <span className="w-1 h-1 rounded-full bg-red-400" /> {v}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                             <button onClick={() => setAnalysis(null)} className="text-slate-500 hover:text-slate-300">×</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Terminal */}
            <div className="h-64 lg:h-auto lg:w-1/2 p-4 bg-slate-950 flex flex-col border-t lg:border-t-0 border-slate-800">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4" /> 运行时日志
                    </h3>
                </div>
                <div className="flex-1 relative">
                    <Terminal logs={logs} isRunning={isRunning} isPaused={isPaused} />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}