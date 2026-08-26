import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Cpu, 
  Key, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  X, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { CustomLLMConfig, DEFAULT_LLM_CONFIG } from '../types/llmConfig';

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CustomLLMConfig) => void;
  initialConfig: CustomLLMConfig;
}

export function LLMConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: LLMConfigModalProps) {
  const [config, setConfig] = useState<CustomLLMConfig>(initialConfig);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    models?: string[];
  } | null>(null);

  useEffect(() => {
    setConfig(initialConfig);
    setTestResult(null);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-llm-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || '¡Conexión exitosa con el proveedor de IA!',
          models: data.models || [],
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'No se pudo conectar con el proveedor especificado.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error de red al intentar verificar la conexión.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Configuración del Motor de IA
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecciona Gemini o conecta tu propio servidor local (Ollama / compatible)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Proveedor Principal de IA
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Gemini option */}
              <button
                type="button"
                onClick={() => {
                  setConfig((prev) => ({ ...prev, provider: 'gemini' }));
                  setTestResult(null);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  config.provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50'
                }`}
              >
                <Zap className={`h-5 w-5 shrink-0 mt-0.5 ${config.provider === 'gemini' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Google Gemini
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Nube ultra rápida con fallback cognitivo Atlas integrado.
                  </div>
                </div>
              </button>

              {/* Ollama option */}
              <button
                type="button"
                onClick={() => {
                  setConfig((prev) => ({ ...prev, provider: 'ollama' }));
                  setTestResult(null);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  config.provider === 'ollama'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50'
                }`}
              >
                <Server className={`h-5 w-5 shrink-0 mt-0.5 ${config.provider === 'ollama' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Ollama Local</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded">Privado</span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Tu servidor personal (Llama 3, Mistral, Qwen, etc.).
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional form fields based on provider */}
          {config.provider === 'gemini' ? (
            <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-zinc-500" />
                  API Key de Gemini (Opcional)
                </label>
                <span className="text-[11px] text-zinc-400">Si dejas vacío usa la clave por defecto</span>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.geminiApiKey || ''}
                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />

              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Modelo de Gemini
                </label>
                <select
                  value={config.geminiModel || 'gemini-2.5-flash'}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Ultra Rápido)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Razonamiento Complejo)</option>
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                </select>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  Protección de alta disponibilidad: Si se agota la cuota o falla la API, el motor local **Atlas Engine** generará tu agenda sin interrumpir tu trabajo.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL del Servidor Ollama
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434 o https://tu-tunel.ngrok-free.app"
                  value={config.ollamaEndpoint || ''}
                  onChange={(e) => setConfig({ ...config, ollamaEndpoint: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Si Ollama corre en tu máquina y usas la app en la nube, expónlo con <code className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">ngrok http 11434</code> o <code className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">OLLAMA_ORIGINS="*"</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del Modelo en Ollama
                </label>
                <input
                  type="text"
                  placeholder="llama3, mistral, qwen2.5, gemma2, etc."
                  value={config.ollamaModel || ''}
                  onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {testResult?.models && testResult.models.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Modelos detectados en tu Ollama:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {testResult.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setConfig({ ...config, ollamaModel: m })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.ollamaModel === m
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-lg text-xs ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? 'Probando...' : 'Probar Conexión'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} className="text-xs">
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
