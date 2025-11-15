"use client";

import Image from "next/image";

interface SluLogoProps {
  className?: string;
}

export function SluLogo({ className = "" }: SluLogoProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label="Saint Louis University Alumni Connect"
    >
      {/* Shield / crest placeholder styled in SLU Blue */}
      <Image
        src="/slu-logo.png"
        alt="Saint Louis University logo"
        width={320}
        height={80}
        priority
        className="h-12 md:h-16 w-auto"
      />
    </div>
  );
}
