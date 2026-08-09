"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type CakeSceneProps = {
  active: boolean;
  reducedMotion: boolean;
  scrollProgress: MutableRefObject<number>;
  theme: "light" | "dark";
};

const CakeScene = dynamic<CakeSceneProps>(() => import("./CakeScene"), {
  ssr: false,
  loading: () => <CakeFallback label="Baking a little magic" />,
});

function CakeFallback({ label = "A two-tier pink birthday cake" }: { label?: string }) {
  return (
    <div className="cake-fallback" role="img" aria-label={label}>
      <span className="fallback-flame" />
      <span className="fallback-candle" />
      <span className="fallback-tier fallback-tier-top" />
      <span className="fallback-tier fallback-tier-bottom" />
      <span className="fallback-plate" />
    </div>
  );
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function CakeHero({ theme }: Pick<CakeSceneProps, "theme">) {
  const stageRef = useRef<HTMLElement>(null);
  const scrollProgress = useRef(0);
  const inViewportRef = useRef(true);
  const documentVisibleRef = useRef(true);
  const [active, setActive] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const hero = stage?.closest<HTMLElement>(".hero");
    if (!stage || !hero) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    const syncActivity = () => setActive(inViewportRef.current && documentVisibleRef.current);

    setWebGLAvailable(supportsWebGL());
    updateMotionPreference();

    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewportRef.current = entry.isIntersecting;
        syncActivity();
      },
      { rootMargin: "0px" },
    );

    const handleVisibilityChange = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
      syncActivity();
    };

    observer.observe(stage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => {
      trigger.kill();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <figure
      ref={stageRef}
      className="hero-cake-stage"
      aria-label="A smiling two-tier birthday cake floating in a magical blossom portal"
    >
      <div className="cake-portal-aura" aria-hidden="true" />
      <div className="cake-portal-ring" aria-hidden="true" />
      <div className="cake-canvas-shell" aria-hidden="true">
        {webGLAvailable === false ? (
          <CakeFallback />
        ) : webGLAvailable === true ? (
          <CakeScene
            active={active}
            reducedMotion={reducedMotion}
            scrollProgress={scrollProgress}
            theme={theme}
          />
        ) : (
          <CakeFallback label="Preparing the birthday cake" />
        )}
      </div>

      <div className="cake-stage-copy">
        <span>Made from wishes, frosting &amp; stardust</span>
        <strong>Scroll to spin the surprise</strong>
      </div>
      <div className="cake-scroll-orbit" aria-hidden="true">
        <span>✦</span>
      </div>
    </figure>
  );
}
