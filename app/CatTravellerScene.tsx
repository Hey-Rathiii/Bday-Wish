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
    let previousState = "";
    const render = () => {
      const direction = motion.current.direction < 0 ? "left" : "right";
      const moving = String(!reducedMotion && motion.current.moving);
      const celebrating = String(!reducedMotion && motion.current.celebrate);
      const nextState = `${direction}:${moving}:${celebrating}`;

      // ScrollTrigger updates this ref every frame, but these three CSS states
      // only change at a hop boundary. Avoid rewriting data attributes at 60fps.
      if (nextState !== previousState) {
        kitten.dataset.direction = direction;
        kitten.dataset.moving = moving;
        kitten.dataset.celebrating = celebrating;
        previousState = nextState;
      }

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
