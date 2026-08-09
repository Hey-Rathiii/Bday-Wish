"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

export type CatMotionState = {
  celebrate: boolean;
  direction: 1 | -1;
  moving: boolean;
  progress: number;
};

export type CatTravellerSceneProps = {
  active: boolean;
  motion: MutableRefObject<CatMotionState>;
  reducedMotion: boolean;
  theme: "light" | "dark";
};

export default function PixelKitten({ active, motion, reducedMotion, theme }: CatTravellerSceneProps) {
  const kittenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kitten = kittenRef.current;
    if (!kitten) return;

    let frame = 0;
    const render = () => {
      kitten.dataset.direction = motion.current.direction < 0 ? "left" : "right";
      kitten.dataset.moving = String(!reducedMotion && motion.current.moving);
      kitten.dataset.celebrating = String(!reducedMotion && motion.current.celebrate);
      if (active && !reducedMotion) frame = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(frame);
  }, [active, motion, reducedMotion]);

  return (
    <div className="pixel-kitten" data-theme={theme} ref={kittenRef}>
      <div className="pixel-kitten__facing">
        <Image
          className="pixel-kitten__sprite"
          src="/pixel-kitten.png"
          alt=""
          width="1254"
          height="1254"
          draggable={false}
          unoptimized
        />
      </div>
    </div>
  );
}
