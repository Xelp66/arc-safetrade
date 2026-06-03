"use client";

import { useState } from "react";

type FallbackImageProps = {
  alt: string;
  className?: string;
  fallbackSrc?: string;
  src: string;
};

export function FallbackImage({
  alt,
  className,
  fallbackSrc = "/placeholder.png",
  src,
}: FallbackImageProps) {
  return (
    <FallbackImageInner
      key={src}
      src={src}
      alt={alt}
      className={className}
      fallbackSrc={fallbackSrc}
    />
  );
}

function FallbackImageInner({
  alt,
  className,
  fallbackSrc,
  src,
}: Required<FallbackImageProps>) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
