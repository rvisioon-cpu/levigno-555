import { ArrowLeft } from 'lucide-react';

interface TourHeaderProps {
    title: string;
    subtitle: string;
    onBack: () => void;
}

const TourHeader = ({ title, subtitle, onBack }: TourHeaderProps) => {
    return (
        <div className="pointer-events-auto inline-flex max-w-[calc(100vw-1.5rem)] items-center rounded-full border border-white/10 bg-black/75 py-2 pl-2 pr-4 shadow-lg backdrop-blur-md">
           <div className="flex min-w-0 items-center gap-3">
               <button 
                 onClick={onBack}
                 aria-label="Volver a recorridos"
                 className="shrink-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 cursor-pointer group"
               >
                 <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
               </button>
               <div className="min-w-0 pr-1">
                 <h2 className="mb-0.5 truncate font-serif text-base leading-tight text-white sm:text-lg">{title}</h2>
                 <p className="truncate font-sans text-xs leading-tight text-white/65">{subtitle}</p>
               </div>
           </div>
        </div>
    );
};

export default TourHeader;
