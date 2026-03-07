/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ELEMENTS, CATEGORY_COLORS, CATEGORY_NAMES, ElementData } from '../logic/elementsData';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

interface PeriodicTableProps {
  onElementClick?: (symbol: string) => void;
  onAddToFormula?: (symbol: string) => void;
}

export const PeriodicTable: React.FC<PeriodicTableProps> = ({ onElementClick, onAddToFormula }) => {
  const [hoveredElement, setHoveredElement] = useState<ElementData | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);

  const renderElement = (element: ElementData) => {
    const colorClass = CATEGORY_COLORS[element.category] || "bg-gray-200 border-gray-400";
    const isHovered = hoveredElement?.symbol === element.symbol;
    const isSelected = selectedElement?.symbol === element.symbol;

    return (
      <motion.div
        key={element.symbol}
        style={{
          gridColumn: element.x,
          gridRow: element.y,
        }}
        whileHover={{ scale: 1.1, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHoveredElement(element)}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={() => {
          setSelectedElement(element);
          if (onElementClick) onElementClick(element.symbol);
        }}
        className={`
          relative flex flex-col items-center justify-center p-1 border rounded cursor-pointer transition-all
          ${colorClass}
          ${isSelected ? 'ring-2 ring-black ring-offset-1' : ''}
          ${isHovered ? 'shadow-lg' : 'shadow-sm'}
          w-full aspect-square
        `}
      >
        <span className="absolute top-0.5 left-1 text-[8px] font-bold opacity-60">{element.atomicNumber}</span>
        <span className="text-sm font-bold">{element.symbol}</span>
        <span className="text-[6px] truncate w-full text-center opacity-80">{element.name}</span>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 p-4 bg-white/50 rounded-xl border border-[#141414]/5">
        {Object.entries(CATEGORY_NAMES).map(([cat, name]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border ${CATEGORY_COLORS[cat]}`}></div>
            <span className="text-[10px] font-medium opacity-70">{name}</span>
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto pb-4">
        <div 
          className="grid gap-1 min-w-[800px]"
          style={{ 
            gridTemplateColumns: 'repeat(18, 1fr)',
            gridTemplateRows: 'repeat(10, 1fr)'
          }}
        >
          {ELEMENTS.map(renderElement)}
          
          {/* Spacer for Lanthanides/Actinides */}
          <div style={{ gridRow: 8, gridColumn: 1 }} className="h-4"></div>
        </div>
      </div>

      {/* Element Detail Overlay */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 w-72 bg-[#141414] text-[#E4E3E0] rounded-2xl p-6 shadow-2xl z-50 border border-white/10"
          >
            <button 
              onClick={() => setSelectedElement(null)}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center border-2 ${CATEGORY_COLORS[selectedElement.category]}`}>
                <span className="text-2xl font-bold">{selectedElement.symbol}</span>
              </div>
              <div>
                <h3 className="text-xl font-serif italic font-bold">{selectedElement.name}</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-50">{CATEGORY_NAMES[selectedElement.category]}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Nº Atômico</p>
                <p className="text-lg font-mono font-bold">{selectedElement.atomicNumber}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Massa Atômica</p>
                <p className="text-lg font-mono font-bold">{selectedElement.atomicMass.toFixed(3)}</p>
              </div>
            </div>

            {onAddToFormula && (
              <button
                onClick={() => onAddToFormula(selectedElement.symbol)}
                className="w-full mt-4 bg-white text-[#141414] py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                Adicionar à Fórmula
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] opacity-50">
              <Info size={12} />
              <span>Clique em outro elemento para comparar ou feche para ocultar.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
