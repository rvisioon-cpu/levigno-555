"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function ForcedLandscapeWrapper({ children }: { children: React.ReactNode }) {
  const isForcedLandscape = useStore((state) => state.isForcedLandscape);
  const pathname = usePathname();
  const isExcluded = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login') || pathname?.startsWith('/ubicacion');
  const shouldForceLandscape = isForcedLandscape && !isExcluded;

  return (
    <div
      className={shouldForceLandscape ? "livigno-landscape" : "relative h-full w-full"}
    >
      {children}
    </div>
  );
}
