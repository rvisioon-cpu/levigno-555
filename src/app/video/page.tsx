'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { projectVideo } from '@/data/video';
import { getActiveMedia } from '@/app/actions/media';

export default function VideoPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [video, setVideo] = useState(projectVideo);
  useEffect(() => { let active = true; getActiveMedia('VIDEO_SIDEBAR').then(rows => { if (active && rows[0]) setVideo({ ...projectVideo, src: rows[0].url, title: rows[0].title }); }).catch(() => {}); return () => { active = false; }; }, []);

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
          key={video.src}
          className="h-full min-h-0 w-full bg-black object-contain"
          controls
          playsInline
          preload="metadata"
          poster={video.poster}
          aria-label={video.title}
        >
          <source src={video.src} type="video/mp4" />
          Tu navegador no permite reproducir este video.
        </video>
      </section>
    </main>
  );
}
