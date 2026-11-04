"use client";
import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useStore } from '../../store/useStore';

const SESSION_KEY = 'livigno-landscape-shown';

const UseLandscape = () => {
    const pathname = usePathname();
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    
    const setForcedLandscape = useStore(state => state.setForcedLandscape);

    useEffect(() => {
        const checkOrientation = () => {
            // Check if device is mobile based on user agent or touch capability + screen width
            // A simple heuristic: narrow width and touch
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024 && 'ontouchstart' in window);
            
            setIsMobile(mobile);

            // Check orientation
            // Use window.orientation (deprecated but useful) or matchMedia
            const portrait = window.matchMedia("(orientation: portrait)").matches;
            setIsPortrait(portrait);
        };

        checkOrientation();

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    useEffect(() => {
        // The map has its own landscape-friendly responsive layout, as in Saint Elliot.
        if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/login') || pathname?.startsWith('/ubicacion')) {
            setShowOverlay(false);
            setForcedLandscape(false);
            return;
        }

        if (isMobile && isPortrait) {
            if (sessionStorage.getItem(SESSION_KEY) === 'true') {
                setShowOverlay(false);
                setForcedLandscape(true);
                return;
            }

            setShowOverlay(true);
            setForcedLandscape(false);
            
            const timer = setTimeout(() => {
                setShowOverlay(false);
                setForcedLandscape(true);
                sessionStorage.setItem(SESSION_KEY, 'true');
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            setShowOverlay(false);
            setForcedLandscape(false);
        }
    }, [isMobile, isPortrait, setForcedLandscape, pathname]);

    if (!showOverlay) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center overscroll-none touch-none">
            
            {/* Project logo */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-brand-orange/20 blur-xl rounded-full animate-pulse" />
                <img 
                    src="/identity/livigno-logo-negative.png" 
                    alt="Livigno 555" 
                    className="w-44 h-auto object-contain relative z-10"
                />
            </div>

            <div className="flex flex-col items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/70 text-white/90 shadow-[0_0_24px_rgba(206,153,77,0.35)]">
                    <Smartphone className="h-12 w-12 animate-device-rotate" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-widest text-white uppercase">
                        Gira tu dispositivo
                    </h2>
                    <p className="text-white/60 font-secondary text-sm tracking-wide">
                        Para una mejor experiencia
                    </p>
                </div>
            </div>
      </div>
    );
};

export default UseLandscape;
