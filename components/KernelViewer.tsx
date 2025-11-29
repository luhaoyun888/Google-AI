
import React, { useState } from 'react';
import { SYSTEM_CODE_FILES } from '../constants/systemCode';
import { FileCode, Copy, Check } from 'lucide-react';

export const KernelViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(SYSTEM_CODE_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full animate-in fade-in duration-300 bg-slate-925">
      {/* File Explorer */}
      <div className="w-full lg:w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
             Go 后端核心 (Backend Core)
           </h3>
           <p className="text-[10px] text-slate-600">
             由 AI 生成的模块化架构代码
           </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {SYSTEM_CODE_FILES.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                selectedFile.name === file.name
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <div className="font-mono truncate">{file.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
         <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
             <div className="flex items-center gap-2">
                 <span className="text-slate-200 font-mono text-sm">{selectedFile.name}</span>
                 <span className="text-slate-600 text-xs"> — {selectedFile.description}</span>
             </div>
             <button 
                onClick={handleCopy}
                className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                title="复制代码"
             >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             </button>
         </div>
         <div className="flex-1 overflow-auto relative bg-slate-950">
             <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed tab-4">
                 <code>{selectedFile.content}</code>
             </pre>
         </div>
      </div>
    </div>
  );
};
