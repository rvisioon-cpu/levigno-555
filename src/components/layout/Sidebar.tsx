"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { X, Home, Building2, Layers, Image, Rotate3D, Video, MapPin, Phone, Facebook, Instagram, Mountain, Construction } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';
import { useStore } from '@/store/useStore';
import { preloadImages, preloadVideo } from '@/utils/preload';
import { buildingFaces } from '@/data/buildingData';
import { floorsData } from '@/data/floors';
import config from '@/config/config';
import features from '@/data/features.json';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Preload triggers (Part 2 of requested strategy)
  useEffect(() => {
    if (isOpen) {
        // "El edificio" (Showroom) Critical Path
        const face0 = buildingFaces[0];
        // 1. Intro Video (Transition from Homepage)
        preloadVideo(getAssetUrl('videos/walks/trans_intro_to_0.mp4')).catch(() => {});
        // 2. Face 0 Day Background
        preloadImages([face0.day.background]).catch(() => {});

        // "Plantas" (Floors) Critical Path
        // 1. Central Walk Video (used as transition to floors)
        if (face0.day.introVideo) preloadVideo(face0.day.introVideo).catch(() => {});
        // 2. Default Floor 9 Image
        const defaultFloor = floorsData.find(f => f.id === '9');
        if (defaultFloor) {
            preloadImages([defaultFloor.floorPlanImage]).catch(() => {});
        }
    }
  }, [isOpen]);

  const allMenuItems = [
    { id: 'intro', icon: Home, label: 'Intro', path: '/' },
    { id: 'showroom', icon: Building2, label: 'El edificio', path: '/showroom', preloadKey: 'showroom' },
    { id: 'floors', icon: Layers, label: 'Plantas', path: '/plantas', preloadKey: 'floors' }, 
    { id: 'amenities', icon: Image, label: 'Amenidades', path: '/galeria', preloadKey: 'amenities' },
    { id: 'tours', icon: Rotate3D, label: 'Recorridos', path: '/recorridos' },
    { id: 'topographic', icon: Mountain, label: 'Topografía', path: '/topography' },
    { id: 'video', icon: Video, label: 'Video', path: '/video' },
    { id: 'location', icon: MapPin, label: 'Ubicación', path: '/ubicacion' },
    { id: 'avance', icon: Construction, label: 'Avance de obra', path: '/avance-de-obra' },
    { id: 'contact', icon: Phone, label: 'Contacto', path: '/contact' },
  ];

  // Filter menu items based on features.json
  const menuItems = allMenuItems.filter(item => (features.sidebar as any)[item.id] !== false);

  const handleNavigation = (path?: string, action?: string) => {
    if (path) {
      if (path.startsWith('/')) {
        // Pass transition state for Showroom via Query Params for Next.js
        if (path === '/showroom') {
            router.push('/showroom?transition=intro');
        } 
        // Route Floors through Showroom for the transition video
        else if (path === '/plantas') {
             // For Next.js, we might need a different strategy or just jump to showroom with floor param
             // Assuming we want the transition:
            router.push('/showroom?transition=floors&targetPath=/plantas');
        }
        else {
            router.push(path);
        }
      } else {
        // Handle external links or scrolling here if needed
      }
      onClose();
    }
  };

  const handleMouseEnter = (key?: string) => {
    if (!key) return;

    // Fire-and-forget preloading (no await)
    if (key === 'showroom') {
        const face0 = buildingFaces[0];
        // Preload Intro Video (Explicit path to match Homepage)
        preloadVideo(getAssetUrl('videos/walks/trans_intro_to_0.mp4')).catch(() => {});
        preloadImages([face0.day.background]).catch(() => {});
    } 
    else if (key === 'floors') {
        // Preload default floor (Floor 9) AND the Central Walk video
        const face0 = buildingFaces[0];
        if (face0.day.introVideo) preloadVideo(face0.day.introVideo).catch(() => {});
        
        const defaultFloor = floorsData.find(f => f.id === '9');
        if (defaultFloor) {
            preloadImages([defaultFloor.floorPlanImage]).catch(() => {});
        }
    }
    else if (key === 'amenities') {
        // Preload first amenity or common ones?
        // (Optional future step)
    }
  };

  const isItemActive = (path?: string) => {
    if (!path) return false;
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    // Special handling for Floors to keep active on any unit/floor page
    if (path === '/plantas' && pathname.startsWith('/plantas')) return true;
    return false;
  };

  const isForcedLandscape = useStore(state => state.isForcedLandscape);

  return (
    <>
      {/* Sidebar Panel */}
      <div className={isForcedLandscape ? `fixed inset-0 z-[70] flex flex-col bg-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}` : 'contents'}>
        
        {/* FORCED LANDSCAPE LAYOUT (Grid) */}
        {isForcedLandscape ? (
            <div className="flex-1 flex flex-col p-6 relative">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-600 hover:text-black hover:bg-gray-200 transition-colors z-20">
                    <X size={24} />
                </button>

                {/* Logo - Smaller, Top Left or Center */}
                <div className="absolute top-6 left-6 z-20">
                     <img src={getAssetUrl('identity/livigno-logo.png')} alt="Livigno 555" className="h-10 object-contain" />
                </div>

                {/* Grid Content */}
                <div className="flex-1 flex items-center justify-center w-full h-full mt-4">
                    <div className="grid grid-cols-5 gap-6 w-full max-w-4xl px-8">
                        {menuItems.map((item) => {
                             const active = isItemActive(item.path);
                             return (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavigation(item.path, (item as any).action)}
                                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all hover:bg-gray-50 group
                                        ${active ? 'bg-[#efdec6]/50' : ''}
                                    `}
                                >
                                    <div className={`p-4 rounded-full transition-all group-hover:scale-110 shadow-sm border border-gray-100
                                         ${active ? 'bg-brand-orange text-white' : 'bg-white text-gray-500 group-hover:text-black'}
                                    `}>
                                        <item.icon size={28} strokeWidth={1.5} />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-brand-orange' : 'text-gray-500 group-hover:text-black'}`}>
                                        {item.label}
                                    </span>
                                </button>
                             );
                        })}
                    </div>
                </div>

                 {/* Footer - Bottom Row */}
                 <div className="absolute bottom-6 left-0 w-full flex justify-center items-center gap-6 text-gray-400">
                     <div className="flex gap-4">
                        {config.company?.buildingSocials?.facebook && (
                            <a href={config.company.buildingSocials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors"><Facebook size={18} /></a>
                        )}
                        {config.company?.buildingSocials?.instagram && (
                            <a href={config.company.buildingSocials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors"><Instagram size={18} /></a>
                        )}
                        {config.company?.buildingSocials?.tiktok && (
                            <a href={config.company.buildingSocials.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors"><TikTokIcon size={18} /></a>
                        )}
                     </div>
                     <div className="h-4 w-px bg-gray-200" />
                     <div className="flex items-center">
                         <img src={getAssetUrl('identity/santa-cruz-logo.png')} alt={config.company?.realStateName || 'Inmobiliaria Santa Cruz'} className="h-8 max-w-32 object-contain" />
                     </div>
                 </div>
            </div>
        ) : (
            /* Brand navigation panel */
            <>
                <div className={`livigno-menu-backdrop fixed inset-0 z-[70] flex flex-col justify-end transition-all duration-500 ${isOpen ? 'is-open' : 'is-closed'}`} onClick={onClose} aria-hidden={!isOpen}>
                    <div className="livigno-menu-scene absolute inset-0" />
                    <img src={getAssetUrl('identity/livigno-logo-negative.png')} alt="Livigno 555" className="livigno-menu-logo absolute left-1/2 top-[43%] w-[min(46vw,390px)] -translate-x-1/2 -translate-y-1/2 object-contain" />

                    <section className="livigno-menu-panel relative z-10 w-full text-white" role="dialog" aria-modal="true" aria-label="Navegación principal" onClick={event => event.stopPropagation()}>
                        <svg className="livigno-menu-mountains" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
                            <path className="mountain-back" d="M0 80 95 65 160 72 250 28 325 66 410 53 485 75 570 43 645 71 735 30 810 72 900 48 970 68 1055 25 1140 70 1220 45 1310 70 1375 50 1440 67V100H0Z" />
                            <path className="mountain-front" d="M0 71 100 82 205 58 285 75 375 48 460 81 550 63 640 76 730 47 820 80 920 57 1005 76 1095 50 1180 79 1270 58 1360 76 1440 62V100H0Z" />
                        </svg>
                        <button onClick={onClose} aria-label="Cerrar menú" className="livigno-menu-close absolute right-5 top-4 z-20 rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white">
                            <X size={20} />
                        </button>

                        <nav className="livigno-menu-nav mx-auto flex w-full max-w-5xl items-center justify-center gap-1 overflow-x-auto px-4 pb-4 pt-10 sm:gap-2 sm:px-8" aria-label="Secciones">
                            {menuItems.map(item => {
                                const active = isItemActive(item.path);
                                return <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item.path, (item as any).action)}
                                    onMouseEnter={() => handleMouseEnter((item as any).preloadKey)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`livigno-menu-item group flex min-w-[66px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-2.5 py-2.5 text-center transition-all sm:min-w-[76px] sm:px-3 ${active ? 'is-active' : ''}`}
                                >
                                    <item.icon size={19} strokeWidth={1.65} />
                                    <span>{item.label}</span>
                                </button>;
                            })}
                        </nav>

                        <footer className="livigno-menu-footer mx-4 border-t border-white/15 px-0 py-2.5 sm:mx-8 sm:px-1">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {config.company?.realStateSocials?.facebook && <a aria-label="Facebook de Santa Cruz" href={config.company.realStateSocials.facebook} target="_blank" rel="noopener noreferrer" className="livigno-social-link"><Facebook size={16} /></a>}
                                    {config.company?.realStateSocials?.instagram && <a aria-label="Instagram de Santa Cruz" href={config.company.realStateSocials.instagram} target="_blank" rel="noopener noreferrer" className="livigno-social-link"><Instagram size={16} /></a>}
                                    {config.company?.realStateSocials?.tiktok && <a aria-label="TikTok de Santa Cruz" href={config.company.realStateSocials.tiktok} target="_blank" rel="noopener noreferrer" className="livigno-social-link"><TikTokIcon size={16} /></a>}
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <img src={getAssetUrl('identity/santa-cruz-logo.png')} alt={config.company?.realStateName || 'Santa Cruz Grupo Inmobiliario'} className="h-6 w-auto max-w-28 object-contain mix-blend-lighten" />
                                    <span className="h-5 w-px bg-white/20" aria-hidden="true" />
                                    <span className="text-[10px] tracking-wide text-white/60">{new Date().getFullYear()} © {config.company?.developer || 'Rvisioon'}</span>
                                </div>
                            </div>
                            <p className="mt-2 text-left text-[9px] leading-relaxed text-white/55">
                                Las imágenes están sujetas a <a href="/terminos-y-condiciones" className="underline underline-offset-2 hover:text-white">términos y condiciones de la inmobiliaria</a>.
                            </p>
                        </footer>
                    </section>
                </div>
            </>
        )}
      </div>
    </>
  );
};

export default Sidebar;
