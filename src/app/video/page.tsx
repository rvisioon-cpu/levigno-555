'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { projectVideo } from '@/data/video';

export default function VideoPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="relative flex h-full min-h-screen flex-col overflow-y-auto bg-[#171717] text-white">
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
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-12 pt-28 lg:px-12 lg:pt-32">
        <h1 className="mb-6 text-center font-serif text-3xl sm:text-4xl">{projectVideo.title}</h1>
        <video
          className="aspect-video w-full rounded-xl bg-black shadow-2xl"
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
