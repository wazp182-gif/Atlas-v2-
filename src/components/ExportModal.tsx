import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  MessageSquare, 
  FileText, 
  Printer,
  Sparkles,
  X
} from 'lucide-react';
import { MeetingAgenda } from '../types/agenda';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { 
  generateGoogleCalendarUrl, 
  downloadIcsFile, 
  generateMarkdown, 
  generateSlackFormat 
} from '../lib/exportUtils';

interface ExportModalProps {
  agenda: MeetingAgenda;
  open: boolean;
  onClose: () => void;
  startDate: string;
  startTime: string;
}

export function ExportModal({ agenda, open, onClose, startDate, startTime }: ExportModalProps) {
  const [copiedType, setCopiedType] = useState<'markdown' | 'slack' | null>(null);

  if (!open) return null;

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(agenda, startDate, startTime);
    navigator.clipboard.writeText(md);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopySlack = () => {
    const text = generateSlackFormat(agenda, startDate, startTime);
    navigator.clipboard.writeText(text);
    setCopiedType('slack');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(agenda, startDate, startTime);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(agenda, startDate, startTime);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-cyan-500" />
          <DialogTitle>Exportar e Integrar Agenda</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2 text-xs">
        <p className="text-zinc-500 dark:text-zinc-400">
          Sincroniza la reunión con tu calendario o compártela directamente con los participantes por canales de comunicación.
        </p>

        {/* Calendar Integrations Section */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
            Calendarios & Convocatorias
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Google Calendar Direct */}
            <button
              type="button"
              onClick={handleOpenGoogleCalendar}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Google Calendar
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Abrir evento 1-Clic</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-cyan-500 transition-colors" />
            </button>

            {/* Apple / Outlook .ICS */}
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Descargar .ICS
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Outlook, Apple, Webcal</span>
                </div>
              </div>
              <Download className="h-4 w-4 text-zinc-400 group-hover:text-cyan-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Copy Text Formats */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
            Formatos de Comunicación Rápida
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Slack / Teams */}
            <button
              type="button"
              onClick={handleCopySlack}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Slack / MS Teams
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Copiar texto formateado</span>
                </div>
              </div>
              {copiedType === 'slack' ? (
                <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Copiado
                </span>
              ) : (
                <Copy className="h-4 w-4 text-zinc-400 group-hover:text-cyan-500" />
              )}
            </button>

            {/* Markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Markdown (.md)
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Notion, GitHub, Confluence</span>
                </div>
              </div>
              {copiedType === 'markdown' ? (
                <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Copiado
                </span>
              ) : (
                <Copy className="h-4 w-4 text-zinc-400 group-hover:text-cyan-500" />
              )}
            </button>
          </div>
        </div>

        {/* Print Option */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="w-full gap-2 text-xs border-zinc-200 dark:border-zinc-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Vista de Impresión / Guardar como PDF</span>
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="default" size="sm" onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
