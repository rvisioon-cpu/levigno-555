import { useLayoutEffect, useRef } from 'react';
import type { Unit } from '../../data/floors';
import UnitCard from './UnitCard';

interface UnitPopoverProps {
  unit: Unit;
  floorId: string;
  scale: number;
  onMouseEnter: (unit: Unit) => void;
  onMouseLeave: () => void;
  onOpenConsultation: (e: React.MouseEvent, unitId: string) => void;
  onNavigate: (path: string) => void;
}

const UnitPopover = ({
  unit,
  floorId,
  scale,
  onMouseEnter,
  onMouseLeave,
  onOpenConsultation,
  onNavigate
}: UnitPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const positionPopover = () => {
      popover.style.bottom = 'calc(100% + 1rem)';
      popover.style.top = 'auto';
      popover.style.transform = `translateX(-50%) scale(${1 / scale})`;

      let rect = popover.getBoundingClientRect();
      if (rect.top < 12) {
        popover.style.bottom = 'auto';
        popover.style.top = 'calc(100% + 1rem)';
        rect = popover.getBoundingClientRect();
      }

      const margin = 12;
      const adjustment = rect.left < margin
        ? margin - rect.left
        : Math.min(0, window.innerWidth - margin - rect.right);
      const renderedScale = rect.width / popover.offsetWidth;
      if (renderedScale) {
        popover.style.transform = `translateX(calc(-50% + ${adjustment / renderedScale}px)) scale(${1 / scale})`;
      }
    };

    positionPopover();
    window.addEventListener('resize', positionPopover);
    return () => window.removeEventListener('resize', positionPopover);
  });

  return (
    <div 
        ref={popoverRef}
        className="absolute bottom-full left-1/2 w-72 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom cursor-auto hidden xl:block"
        style={{ 
            transform: `translateX(-50%) scale(${1/scale})`, 
            transformOrigin: 'bottom center'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => onMouseEnter(unit)}
        onMouseLeave={onMouseLeave}
    >
        <UnitCard 
            unit={unit}
            floorId={floorId}
            onOpenConsultation={onOpenConsultation}
            onNavigate={onNavigate}
        />
        
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100 shadow-sm z-0"></div>
    </div>
  );
};

export default UnitPopover;
