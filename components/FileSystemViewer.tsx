import React from 'react';
import { FileText, Folder, HardDrive } from 'lucide-react';

interface FileSystemViewerProps {
  files: Record<string, string>;
}

export const FileSystemViewer: React.FC<FileSystemViewerProps> = ({ files }) => {
  const sortedPaths = Object.keys(files).sort();

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" /> 虚拟文件系统 (Virtual FS)
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            只读仿真视图
        </span>
      </div>
     
      <div className="space-y-2">
        {sortedPaths.length === 0 ? (
            <div className="text-center py-8 text-slate-600 italic text-sm border-2 border-dashed border-slate-800 rounded-lg">
                文件系统为空
            </div>
        ) : (
            sortedPaths.map((path) => {
                const isGenerated = files[path].includes("由"); // Simple check for mock data
                return (
                    <div key={path} className={`group flex items-start gap-3 p-3 rounded-lg border text-sm transition-all ${
                        isGenerated 
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}>
                        <FileText className={`w-5 h-5 mt-0.5 ${isGenerated ? 'text-emerald-400' : 'text-blue-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-200 font-medium truncate">{path}</span>
                                {isGenerated && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded">NEW</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 truncate font-mono opacity-80 group-hover:opacity-100">
                                size: {files[path].length} bytes | {files[path]}
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};