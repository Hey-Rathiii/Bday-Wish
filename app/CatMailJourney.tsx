"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CatMotionState, CatTravellerSceneProps } from "./CatTravellerScene";

gsap.registerPlugin(Flip, ScrollTrigger);

const CatTravellerScene = dynamic<CatTravellerSceneProps>(() => import("./CatTravellerScene"), {
  ssr: false,
  loading: () => <span className="pixel-kitten-fallback" aria-hidden="true">✦</span>,
});

const notes = [
  {
    number: "01",
    overline: "For your smile",
    title: "A tiny reminder",
    preview: "Open when you forget how naturally you light up a room.",
    message: "Your smile has a way of making ordinary moments feel worth remembering. I hope today gives it a hundred reasons to appear.",
    tone: "rose",
  },
  {
    number: "02",
    overline: "For your heart",
    title: "Soft is powerful",
    preview: "A note for the kindness you carry so effortlessly.",
    message: "The gentleness in you is not a small thing. It is one of the bravest, loveliest ways a person can move through the world.",
    tone: "sky",
  },
  {
    number: "03",
    overline: "For difficult days",
    title: "Keep this close",
    preview: "Open whenever the world feels a little too loud.",
    message: "You never have to earn rest, softness, or love. Breathe slowly. Take your time. You are allowed to be held by the day too.",
    tone: "lilac",
  },
  {
    number: "04",
    overline: "For right now",
    title: "Birthday magic",
    preview: "The final envelope has been waiting especially for you.",
    message: "May this birthday begin a year full of brave dreams, unexpected laughter, and the kind of happiness that finds you again and again.",
    tone: "gold",
  },
] as const;

export function CatMailJourney({ theme }: Pick<CatTravellerSceneProps, "theme">) {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const travellerRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<CatMotionState>({ celebrate: false, direction: 1, moving: false, progress: 0 });
  const [active, setActive] = useState(false);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    const traveller = travellerRef.current;
    if (!section || !path || !traveller) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeline: gsap.core.Timeline | undefined;
    let resizeCall: gsap.core.Tween | undefined;

    const buildJourney = () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      gsap.set(traveller, { clearProps: "transform,width,height" });

      const stops = Array.from(path.querySelectorAll<HTMLElement>(".cat-stop"));
      if (!stops.length) return;

      // This is the same core technique as the GSAP Scroll Waypoints demo:
      // capture every marker, then Flip.fit one persistent traveller between them.
      const stopStates = stops.map((stop) => Flip.getState(stop));
      Flip.fit(traveller, stopStates[0], { absolute: true, scale: true });

      if (motionQuery.matches) {
        motionRef.current.progress = 0;
        motionRef.current.moving = false;
        return;
      }

      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: path,
          start: "top 68%",
          end: "bottom 38%",
          scrub: 1.15,
          onUpdate: (self) => {
            motionRef.current.progress = self.progress;
            motionRef.current.direction = self.direction < 0 ? -1 : 1;
            const timelineTime = timeline?.time() ?? 0;
            const localSegmentTime = timelineTime - Math.min(2, Math.floor(timelineTime / 1.35)) * 1.35;
            motionRef.current.moving = localSegmentTime > 0.035 && localSegmentTime < 0.965;
          },
        },
      });

      stopStates.slice(1).forEach((state, index) => {
        const hop = Flip.fit(traveller, state, {
          absolute: true,
          duration: 1,
          ease: "none",
          scale: true,
        });
        if (hop) timeline?.add(hop as gsap.core.Tween, index * 1.35);
      });
    };

    const handleMotionChange = () => {
      setReducedMotion(motionQuery.matches);
      buildJourney();
    };
    const handleResize = () => {
      resizeCall?.kill();
      resizeCall = gsap.delayedCall(0.18, () => {
        buildJourney();
        ScrollTrigger.refresh();
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && document.visibilityState === "visible"),
      { rootMargin: "25% 0px" },
    );
    const handleVisibility = () => setActive(section.getBoundingClientRect().bottom > 0 && document.visibilityState === "visible");

    setReducedMotion(motionQuery.matches);
    observer.observe(section);
    motionQuery.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize, { passive: true });
    document.fonts.ready.then(buildJourney);

    return () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      resizeCall?.kill();
      observer.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    motionRef.current.celebrate = activeNote !== null;
    if (activeNote === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveNote(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNote]);

  return (
    <section className="cat-mail-journey" id="notes" ref={sectionRef}>
      <div className="cat-mail-heading" data-reveal>
        <p className="eyebrow">Follow the little paws / 05</p>
        <h2>Four tiny mails.<br /><em>One curious guide.</em></h2>
        <p>Scroll slowly. The birthday cat knows where every secret is hiding.</p>
      </div>

      <div className="cat-waypoint-stage" ref={pathRef}>
        <div className="cat-path-thread" aria-hidden="true" />
        {notes.map((note, index) => (
          <article className={`cat-mail-card cat-mail-card-${index + 1}`} data-tone={note.tone} key={note.number}>
            <span className="cat-stop" aria-hidden="true" />
            <button type="button" onClick={() => setActiveNote(index)} aria-label={`Open note: ${note.title}`}>
              <span className="cat-mail-number">MAIL / {note.number}</span>
              <span className="cat-mail-stamp" aria-hidden="true">{index === 3 ? "✦" : "♡"}</span>
              <span className="cat-mail-overline">{note.overline}</span>
              <strong>{note.title}</strong>
              <span className="cat-mail-preview">{note.preview}</span>
              <span className="cat-mail-open">open this note <i aria-hidden="true">↗</i></span>
              <span className="cat-mail-fold" aria-hidden="true" />
            </button>
          </article>
        ))}

        <div className="cat-traveller" ref={travellerRef} aria-hidden="true">
          <div className="cat-traveller-glow" />
          <CatTravellerScene active={active} motion={motionRef} reducedMotion={reducedMotion} theme={theme} />
          <span className="cat-paw-label">your tiny guide</span>
        </div>
      </div>

      {activeNote !== null && (
        <div className="cat-note-modal" role="dialog" aria-modal="true" aria-labelledby="cat-note-title">
          <article data-tone={notes[activeNote].tone}>
            <button className="cat-note-close" type="button" onClick={() => setActiveNote(null)} aria-label="Close note">×</button>
            <span className="cat-note-kicker">MAIL / {notes[activeNote].number} · {notes[activeNote].overline}</span>
            <h3 id="cat-note-title">{notes[activeNote].title}</h3>
            <p>{notes[activeNote].message}</p>
            <span className="cat-note-signoff">A little reminder, wrapped just for you ♡</span>
          </article>
        </div>
      )}
    </section>
  );
}
