import React, { useState, useEffect } from 'react';
import { WasmPlugin, PluginLanguage } from '../types';
import { X, Save } from 'lucide-react';

interface PluginFormProps {
  initialData?: WasmPlugin | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plugin: WasmPlugin) => void;
}

const TEMPLATE_CODE = `package main

import "fmt"

func main() {
    fmt.Println("Hello Wasm!")
}`;

export const PluginForm: React.FC<PluginFormProps> = ({ initialData, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<WasmPlugin>>({
    name: '',
    description: '',
    language: PluginLanguage.GO,
    size: '1.0MB',
    code: TEMPLATE_CODE,
    mockActions: [],
    status: 'active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        description: '',
        language: PluginLanguage.GO,
        size: '1.0MB',
        code: TEMPLATE_CODE,
        mockActions: [],
        status: 'active'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      mockActions: formData.mockActions || [],
    } as WasmPlugin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-100">
            {initialData ? '编辑插件 (Edit Plugin)' : '新建插件 (New Plugin)'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">插件名称 (Name)</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="e.g. DataProcessor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">语言 (Language)</label>
                <select
                    value={formData.language}
                    onChange={e => setFormData({...formData, language: e.target.value as PluginLanguage})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                    {Object.values(PluginLanguage).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">预估大小 (Size)</label>
                <input
                    type="text"
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 2.5MB"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">描述 (Description)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              placeholder="简述插件功能..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md shadow-lg shadow-emerald-900/20 transition-all"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};