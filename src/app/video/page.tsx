'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { projectVideo } from '@/data/video';

export default function VideoPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="relative flex h-screen min-h-0 flex-col overflow-hidden bg-[#171717] text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between p-6 lg:p-12">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
          className="rounded-full border border-white/20 bg-brand-primary/80 p-2 text-white shadow-lg backdrop-blur-xl transition-colors hover:bg-brand-primary"
        >
          <Menu size={24} />
        </button>
        <FullScreenToggle />
      </header>
      <section className="flex min-h-0 w-full flex-1">
        <video
          className="h-full min-h-0 w-full bg-black object-contain"
          controls
          playsInline
          preload="metadata"
          poster={projectVideo.poster}
          aria-label={projectVideo.title}
        >
          <source src={projectVideo.src} type="video/mp4" />
          Tu navegador no permite reproducir este video.
        </video>
      </section>
    </main>
  );
}
