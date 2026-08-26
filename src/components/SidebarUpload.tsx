import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Clock, 
  Settings2, 
  CheckCircle2, 
  Trash2, 
  Sliders, 
  ChevronDown, 
  Layers, 
  ArrowRight, 
  AlertCircle, 
  FileCode, 
  Compass, 
  Cpu 
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Textarea } from './ui/input';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../lib/sampleDocs';
import { MeetingSettings, UploadedFileMeta } from '../types/agenda';
import { CustomLLMConfig } from '../types/llmConfig';

interface SidebarUploadProps {
  onGenerate: (data: {
    documentText?: string;
    fileData?: { mimeType: string; data: string };
    settings: MeetingSettings;
    sampleId?: string;
  }) => Promise<void>;
  isLoading: boolean;
  onSelectSample: (sample: SampleDoc) => void;
  selectedSampleId: string | null;
  llmConfig: CustomLLMConfig;
  onOpenLLMConfig: () => void;
}

export function SidebarUpload({
  onGenerate,
  isLoading,
  onSelectSample,
  selectedSampleId,
  llmConfig,
  onOpenLLMConfig,
}: SidebarUploadProps) {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste' | 'samples'>('samples');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Settings
  const [targetDuration, setTargetDuration] = useState<number>(60);
  const [meetingType, setMeetingType] = useState<string>('Revisión y Toma de Decisiones');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const durationOptions = [
    { label: '15 min (Flash)', value: 15 },
    { label: '30 min (Express)', value: 30 },
    { label: '45 min (Estándar)', value: 45 },
    { label: '60 min (Completa)', value: 60 },
    { label: '90 min (Estratégica)', value: 90 },
    { label: '120 min (Taller/Workshop)', value: 120 },
  ];

  const meetingTypes = [
    'Revisión y Toma de Decisiones',
    'Alineación Ejecutiva y Estrategia',
    'Post-Mortem y Análisis Técnico',
    'Kickoff de Proyecto & Sprint',
    'Comité de Dirección / Board',
    'Brainstorming & Solución de Problemas',
  ];

  const handleFileProcess = (file: File) => {
    setUploadError(null);

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('El archivo excede el tamaño máximo permitido de 25MB.');
      return;
    }

    const reader = new FileReader();

    // Check if plain text or markdown
    if (
      file.type === 'text/plain' ||
      file.type === 'text/markdown' ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt')
    ) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPastedText(text);
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textSnippet: text.slice(0, 180),
        });
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          base64Data,
          textSnippet: `Archivo binario (${file.type}) listo para procesamiento neuronal directo.`,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Fallback read as text
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPastedText(text);
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          textSnippet: text.slice(0, 180),
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSelectPredefinedSample = (sample: SampleDoc) => {
    onSelectSample(sample);
    setPastedText(sample.content);
    setTargetDuration(sample.defaultDuration);
    setMeetingType(sample.meetingType);
    setUploadedFile({
      name: `${sample.title}.md`,
      size: sample.content.length,
      type: 'text/markdown',
      textSnippet: sample.description,
    });
  };

  const handleTriggerGenerate = () => {
    const settings: MeetingSettings = {
      targetDuration,
      meetingType,
      customInstructions,
      language,
    };

    if (uploadedFile?.base64Data) {
      onGenerate({
        fileData: {
          mimeType: uploadedFile.type,
          data: uploadedFile.base64Data,
        },
        documentText: pastedText || undefined,
        settings,
        sampleId: selectedSampleId || undefined,
      });
    } else {
      onGenerate({
        documentText: pastedText,
        settings,
        sampleId: selectedSampleId || undefined,
      });
    }
  };

  const hasContent = Boolean(uploadedFile || pastedText.trim().length > 20);

  return (
    <aside className="w-full lg:w-96 shrink-0 flex flex-col gap-4 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/60 p-4 lg:p-5 overflow-y-auto max-h-none lg:max-h-[calc(100vh-61px)]">
      {/* Brand & System Status / LLM Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${llmConfig.provider === 'ollama' ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`} />
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {llmConfig.provider === 'ollama' ? 'Ollama Local' : 'Atlas Neural Core'}
          </span>
        </div>
        <button
          onClick={onOpenLLMConfig}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          title="Cambiar entre Gemini y Ollama Local"
        >
          <Cpu className="h-3 w-3" />
          <span>Configurar IA</span>
        </button>
      </div>

      {/* Input Mode Selector */}
      <div className="flex rounded-lg bg-zinc-200/80 dark:bg-zinc-900 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveInputTab('samples')}
          className={`flex-1 py-1.5 px-2 font-medium rounded-md transition-all text-center cursor-pointer ${
            activeInputTab === 'samples'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Ejemplos
        </button>
        <button
          type="button"
          onClick={() => setActiveInputTab('upload')}
          className={`flex-1 py-1.5 px-2 font-medium rounded-md transition-all text-center cursor-pointer ${
            activeInputTab === 'upload'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Subir Archivo
        </button>
        <button
          type="button"
          onClick={() => setActiveInputTab('paste')}
          className={`flex-1 py-1.5 px-2 font-medium rounded-md transition-all text-center cursor-pointer ${
            activeInputTab === 'paste'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Pegar Texto
        </button>
      </div>

      {/* Mode 1: Predefined Executive Samples */}
      {activeInputTab === 'samples' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Plantillas Reales
            </span>
            <span className="text-[10px] text-zinc-400">Listas para analizar</span>
          </div>

          <div className="space-y-2">
            {SAMPLE_DOCUMENTS.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectPredefinedSample(sample)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 dark:border-cyan-400 dark:bg-cyan-950/30'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-500 rounded-bl" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {sample.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 font-mono">
                      {sample.defaultDuration}m
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {sample.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: File Upload (PDF, Markdown, TXT, Docs) */}
      {activeInputTab === 'upload' && (
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.txt,.md,.doc,.docx"
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700'
            }`}
          >
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <UploadCloud className="h-6 w-6 text-cyan-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Arrastra tu documento o haz clic para explorar
              </p>
              <p className="text-[10px] text-zinc-400">
                PDF, Markdown, TXT o Documentos de Proyecto (hasta 25MB)
              </p>
            </div>
          </div>

          {uploadedFile && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • Listo para procesar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setPastedText('');
                }}
                className="p-1 text-zinc-400 hover:text-red-400 cursor-pointer"
                title="Eliminar archivo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Direct Text Paste */}
      {activeInputTab === 'paste' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Contenido o Minuta del Documento:
          </label>
          <Textarea
            rows={7}
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              if (uploadedFile) setUploadedFile(null);
            }}
            placeholder="Pega aquí la minuta de reunión anterior, propuesta técnica, plan de proyecto o especificación de producto..."
            className="text-xs font-mono resize-none bg-white dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-800"
          />
          <div className="flex justify-between items-center text-[10px] text-zinc-400">
            <span>{pastedText.length} caracteres</span>
            {pastedText && (
              <button
                type="button"
                onClick={() => setPastedText('')}
                className="hover:text-red-400 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Meeting Duration & Type Calibration */}
      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-500" />
            <span>Duración Meta de la Reunión:</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetDuration(opt.value)}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium border text-center transition-all cursor-pointer ${
                  targetDuration === opt.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-500" />
            <span>Formato / Tipo de Reunión:</span>
          </label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className="w-full text-xs rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none"
          >
            {meetingTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Expandable Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <Sliders className="h-3 w-3" />
            <span>Instrucciones Especiales</span>
            <ChevronDown
              className={`h-3 w-3 transform transition-transform ${
                showAdvanced ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-2 pt-2">
              <Textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ej: Dar mayor énfasis al tema de infraestructura, o reservar 15 min exclusivos para preguntas del CFO..."
                className="text-xs bg-white dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Execution Trigger Button */}
      <div className="pt-2">
        <Button
          onClick={handleTriggerGenerate}
          disabled={!hasContent || isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-zinc-950 font-bold py-2.5 text-xs tracking-wide shadow-md hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
              <span>Analizando & Estructurando Agenda...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 fill-current" />
              <span>Generar Agenda Inteligente</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
