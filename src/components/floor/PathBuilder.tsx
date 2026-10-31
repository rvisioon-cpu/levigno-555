"use client";
import { useState } from 'react';
import { Copy, Check, RotateCcw, Trash2, Crosshair } from 'lucide-react';

interface PathBuilderProps {
  generatedPath: string;
  points?: { x: number; y: number }[];
  onUndo: () => void;
  onClear: () => void;
}

const PathBuilder = ({ generatedPath, points = [], onUndo, onClear }: PathBuilderProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!generatedPath) return;
    navigator.clipboard.writeText(generatedPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl w-80 text-xs space-y-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crosshair size={16} className="text-blue-600" />
          <span className="font-bold text-gray-800 text-sm">Selector de Coordenadas</span>
        </div>
        <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
          {points.length} {points.length === 1 ? 'punto' : 'puntos'}
        </span>
      </div>

      {lastPoint && (
        <div className="bg-gray-100 p-2 rounded-lg text-[11px] font-mono text-gray-700 flex justify-between">
          <span>Último punto:</span>
          <span className="font-bold text-blue-700">x: {Math.round(lastPoint.x * 10) / 10}%, y: {Math.round(lastPoint.y * 10) / 10}%</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Path SVG generado:</label>
        <textarea 
          readOnly 
          value={generatedPath} 
          placeholder="Haz clic sobre el plano para trazar los vértices del polígono..."
          className="w-full h-20 bg-gray-50 border border-gray-200 p-2 rounded-lg font-mono text-[10px] break-all select-all focus:outline-none focus:border-blue-500 text-gray-800 resize-none"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      <div className="flex gap-2">
        <button 
          type="button"
          onClick={handleCopy}
          disabled={!generatedPath}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium flex items-center justify-center gap-1 transition-all shadow-sm"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
        </button>
        <button 
          type="button"
          onClick={onUndo}
          disabled={points.length === 0}
          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Deshacer</span>
        </button>
        <button 
          type="button"
          onClick={onClear}
          disabled={points.length === 0}
          className="py-1.5 px-3 bg-red-50 hover:bg-red-100 disabled:opacity-40 rounded-lg text-red-600 font-medium flex items-center justify-center transition-colors"
          title="Limpiar puntos"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <p className="text-[10px] text-gray-500 italic leading-snug">
        Haz clic en las esquinas de cada departamento para generar su polígono de selección.
      </p>
    </div>
  );
};

export default PathBuilder;
