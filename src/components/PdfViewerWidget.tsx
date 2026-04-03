import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface PdfViewerWidgetProps {
  url: string;
  name?: string;
  className?: string;
}

export default function PdfViewerWidget({ url, name, className }: PdfViewerWidgetProps) {
  return (
    <div className={cn("w-full flex flex-col bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-200", className)}>
      {/* Header/Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="max-w-[200px] sm:max-w-md">
            <h4 className="text-sm font-bold text-slate-800 truncate">{name || 'Documento PDF'}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualização Segura</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-full transition-all"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <a 
            href={url} 
            download={name}
            className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-full transition-all"
            title="Baixar arquivo"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative flex-1 min-h-[500px] bg-slate-200">
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full border-none"
          title={name || 'PDF Viewer'}
        />
      </div>
    </div>
  );
}
