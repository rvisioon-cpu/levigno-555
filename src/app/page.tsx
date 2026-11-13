"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import Sidebar from '@/components/layout/Sidebar';
import { buildingFaces, buildingOpening, buildingAerialLoop } from '@/data/buildingData';
import { useStore } from '@/store/useStore';
import { preloadVideo, preloadImages } from '@/utils/preload';
import Loader from '@/components/UI/Loader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { homepageData } from '@/data/homepage';

const Homepage = () => {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Animation Refs
  const logoRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Timeline Ref to control animation
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Preload the poster immediately to avoid gray screen
    const img = new Image();
    img.src = homepageData.intro.poster;
    
    // Create timeline but don't auto-repeat infinitely (we handle restart via video sync)
    const tl = gsap.timeline({ defaults: { ease: "power2.out" }, paused: false });
    tlRef.current = tl;
    
    // Initial Setup
    gsap.set(textRefs.current, { y: 20, autoAlpha: 0 }); 
    
    // 1. Initial State: Logo centered (3s wait)
    tl.to({}, { duration: 3 })
    
      .to(logoRef.current, { 
        top: '18%',
        duration: 2, 
        ease: "power3.inOut" 
      }, "moveUp")
      
    // 3. Text Cycle
    // Using data-driven slides
    homepageData.slides.forEach((slide, index) => {
        // Appear
        if (index === 0) {
            tl.to(textRefs.current[index], { y: 0, autoAlpha: 1, duration: 1 }, "-=0.5");
        } else {
            tl.fromTo(textRefs.current[index], 
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 1 }
            );
        }

        // Disappear (except maybe hold the last one? original logic cycled them all)
        tl.to(textRefs.current[index], { 
            y: -20, 
            autoAlpha: 0, 
            duration: 0.8,
            delay: 5 
        });
    });

    // End: Logo returns to center
    tl.to(logoRef.current, { 
        top: '50%',
        duration: 1.5,
        ease: "power3.inOut" 
    }, "reset");

    return () => {
      tl.kill();
    };
  }, []);

  // Store actions
  const isLoadingAssets = useStore(state => state.isLoadingAssets);

  const handleStartIntro = async () => {
    router.push('/showroom?transition=intro');
  };

  const handleBackgroundVideoEnded = () => {
      const video = videoRef.current;
      if (!video) return;

      // Logic:
      // 1. Always replay video (manual loop)
      video.play().catch(e => console.log("Video play failed", e));
      
      // 2. If Timeline is finished (progress == 1), restart it
      if (tlRef.current && tlRef.current.progress() === 1) {
          tlRef.current.restart();
      }
  };

  return (
    <div className="h-full w-full relative overflow-hidden font-sans flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="fixed top-6 right-6 z-50">
        <FullScreenToggle />
      </div>

      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          poster={homepageData.intro.poster}
          className="w-full h-full object-cover"
          onEnded={handleBackgroundVideoEnded}
          // Prioritize loading intro assets as soon as the main video can play
          onCanPlay={() => {
              // 1. Silent preload of the "Enter" transition video
              preloadVideo(buildingOpening[0]).catch(() => {});
              preloadVideo(buildingAerialLoop).catch(() => {});
              // 2. Silent preload of the first building face (Daylight)
              preloadImages([buildingFaces[0].day.background]).catch(() => {});
          }}
        >
          <source src={homepageData.intro.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 h-full p-6 text-white">
        
        {/* Header */}
        <div className="flex justify-between items-start shrink-0">
          <div className="flex gap-4">
             {/* Menu Icon */}
             <div className="group relative z-30 flex items-center">
               <button 
                 onClick={() => setSidebarOpen(true)}
                 className="p-2 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full transition-all cursor-pointer text-white relative z-10 shadow-lg"
               >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20M4 6H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
               </button>
               <span className="absolute left-full ml-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
                 Menu
               </span>
             </div>
          </div>
        </div>

        {/* Central Hero Section */}
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-6xl [container-type:size]">
             
             {/* Logo & Button Container */}
             <div ref={logoRef} className="absolute left-1/2 top-1/2 z-20 w-full -translate-x-1/2 -translate-y-1/2">
                 <img
                   src={homepageData.hero.logo} 
                   alt="Livigno 555"
                   className="mx-auto max-h-[22cqh] w-[min(50%,28rem)] object-contain drop-shadow-2xl opacity-90"
                 />
             </div>

             <button 
                onClick={handleStartIntro}
                disabled={isLoadingAssets}
                className={`pointer-events-auto absolute bottom-[9%] left-1/2 z-30 group -translate-x-1/2 px-8 lg:px-12 py-3 lg:py-4 bg-brand-primary/90 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white text-xs lg:text-sm font-medium tracking-widest uppercase rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-xl font-secondary shrink-0
                    opacity-100
                    ${isLoadingAssets ? 'cursor-wait opacity-80' : ''}
                `}
              >
                <span className="relative z-10 font-bold tracking-[0.2em] flex items-center gap-2">
                    {isLoadingAssets ? <Loader /> : homepageData.hero.button}
                </span>
              </button>

             {/* Presentation Text Container */}
             <div className="absolute top-[55%] inset-x-6 z-10">
                 
                 {homepageData.slides.map((slide, index) => (
                    <p 
                        key={index}
                        ref={el => { textRefs.current[index] = el }} 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-black/45 backdrop-blur-md rounded-2xl p-[clamp(0.5rem,4cqh,1.75rem)] text-center text-[clamp(0.75rem,5cqh,1.5rem)] font-light tracking-wide opacity-0 text-white drop-shadow-lg mx-auto"
                    >
                        {slide.highlight ? (
                            <><span className="font-bold">{slide.highlight}</span> {slide.text.replace('{{highlight}}', '').trim()}</>
                        ) : (
                            slide.text
                        )}
                    </p>
                 ))}

             </div>

        </div>

      </div>

    </div>
  );
};

export default Homepage;
