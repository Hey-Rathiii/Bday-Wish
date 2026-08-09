"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BlossomRush } from "./BlossomRush";
import { CakeHero } from "./CakeHero";
import { CatMailJourney } from "./CatMailJourney";
import { SwipeStory } from "./SwipeStory";

gsap.registerPlugin(ScrollTrigger);

const petals = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: -((index * 1.7) % 14),
  duration: 9 + (index % 7),
  drift: -70 + ((index * 53) % 140),
  size: 8 + (index % 5) * 2,
}));

const confetti = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  x: -190 + ((index * 83) % 380),
  y: -90 - ((index * 47) % 240),
  rotate: (index * 71) % 360,
  delay: (index % 8) * 0.035,
}));

const truths = [
  "You make ordinary days glow.",
  "Your laugh is my favorite soundtrack.",
  "You carry softness like a superpower.",
  "The world is brighter with you in it.",
  "Today, the universe celebrates you.",
];

export function BirthdayExperience() {
  const pageRef = useRef<HTMLElement>(null);
  const promiseVideoRef = useRef<HTMLVideoElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [letterOpen, setLetterOpen] = useState(false);
  const [wishMade, setWishMade] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("birthday-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("birthday-theme", theme);
  }, [theme]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const promiseVideo = promiseVideoRef.current;
    const promiseStage = promiseVideo?.closest(".promise-stage") as HTMLElement | null;
    const videoProgress = { value: 0 };
    let videoSeekFrame = 0;
    let videoSeekTimer = 0;
    let pendingVideoTime: number | null = null;
    let lastVideoSeekAt = Number.NEGATIVE_INFINITY;
    let videoPreloadObserver: IntersectionObserver | null = null;
    const videoSeekInterval = 1000 / 24;

    const scheduleVideoSeek = () => {
      if (videoSeekFrame || videoSeekTimer) return;

      const remaining = Math.max(0, videoSeekInterval - (performance.now() - lastVideoSeekAt));
      if (remaining > 0) {
        videoSeekTimer = window.setTimeout(() => {
          videoSeekTimer = 0;
          videoSeekFrame = window.requestAnimationFrame(flushVideoSeek);
        }, remaining);
        return;
      }

      videoSeekFrame = window.requestAnimationFrame(flushVideoSeek);
    };

    const flushVideoSeek = () => {
      videoSeekFrame = 0;
      if (!promiseVideo || pendingVideoTime === null || promiseVideo.seeking) return;

      const nextTime = pendingVideoTime;
      pendingVideoTime = null;
      if (Math.abs(promiseVideo.currentTime - nextTime) > 0.032) {
        lastVideoSeekAt = performance.now();
        promiseVideo.currentTime = nextTime;
      }
    };

    const seekPromiseVideo = (progress: number) => {
      if (!promiseVideo || !Number.isFinite(promiseVideo.duration) || promiseVideo.duration <= 0) return;

      const boundedProgress = Math.min(1, Math.max(0, progress));
      pendingVideoTime = boundedProgress * Math.max(0, promiseVideo.duration - 0.04);
      scheduleVideoSeek();
    };

    const handleVideoSeeked = () => {
      if (pendingVideoTime !== null) scheduleVideoSeek();
    };

    const handleVideoMetadata = () => {
      promiseVideo?.pause();
      seekPromiseVideo(reduceMotion ? 0.58 : videoProgress.value);
    };

    const handleVideoReady = () => promiseStage?.classList.add("is-video-ready");
    const handleVideoError = () => promiseStage?.classList.add("is-video-error");

    promiseVideo?.addEventListener("loadedmetadata", handleVideoMetadata);
    promiseVideo?.addEventListener("loadeddata", handleVideoReady);
    promiseVideo?.addEventListener("seeked", handleVideoSeeked);
    promiseVideo?.addEventListener("error", handleVideoError);
    if (promiseVideo && promiseVideo.readyState >= 1) handleVideoMetadata();
    if (promiseVideo && promiseVideo.readyState >= 2) handleVideoReady();

    if (!reduceMotion && promiseVideo) {
      if (promiseStage && "IntersectionObserver" in window) {
        videoPreloadObserver = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          promiseStage.classList.remove("is-video-ready");
          promiseVideo.preload = "auto";
          promiseVideo.load();
          videoPreloadObserver?.disconnect();
          videoPreloadObserver = null;
        }, { rootMargin: "180% 0px" });
        videoPreloadObserver.observe(promiseStage);
      } else {
        promiseVideo.preload = "auto";
      }
    }

    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set("[data-reveal], .hero-kicker, .hero-title span, .hero-note", { opacity: 1, y: 0 });
        return;
      }

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .fromTo(".hero-kicker", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(".hero-title span", { opacity: 0, yPercent: 105, rotate: 2 }, { opacity: 1, yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.12 }, "-=0.42")
        .fromTo(".hero-note", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
        .fromTo(".hero-cake-stage", { opacity: 0, scale: 1.06, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1.4 }, 0.2);

      gsap.to(".cake-portal-ring", {
        rotate: 18, scale: 1.08, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-title", {
        yPercent: -15, opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 48 }, {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 87%", once: true },
        });
      });

      const promiseTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".promise-stage",
          start: "top top",
          end: () => `+=${window.innerHeight * 4.6}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => promiseStage?.classList.toggle("is-video-active", self.isActive),
        },
      });
      gsap.set(".truth-line", { opacity: 0, y: 44 });
      const storyDuration = 7;

      promiseTimeline
        .to(videoProgress, {
          value: 1,
          duration: storyDuration,
          ease: "none",
          onUpdate: () => seekPromiseVideo(videoProgress.value),
        }, 0)
        .fromTo(".promise-video", { scale: 1.035 }, { scale: 1, duration: storyDuration, ease: "none" }, 0);

      truths.forEach((_, index) => {
        const revealAt = index * 1.4;
        promiseTimeline
          .to(`.truth-line:nth-child(${index + 1})`, { opacity: 1, y: 0, duration: 0.48, ease: "power2.out" }, revealAt);

        if (index < truths.length - 1) {
          promiseTimeline.to(`.truth-line:nth-child(${index + 1})`, { opacity: 0, y: -35, duration: 0.38, ease: "power2.in" }, revealAt + 1);
        }
      });

      gsap.fromTo(".letter-card", { rotate: -5, y: 100 }, {
        rotate: 1.5, y: -15, ease: "none",
        scrollTrigger: { trigger: ".letter-section", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.fromTo(".cake-photo", { scale: 1.15 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ".wish-section", start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }, pageRef);

    return () => {
      promiseVideo?.removeEventListener("loadedmetadata", handleVideoMetadata);
      promiseVideo?.removeEventListener("loadeddata", handleVideoReady);
      promiseVideo?.removeEventListener("seeked", handleVideoSeeked);
      promiseVideo?.removeEventListener("error", handleVideoError);
      promiseVideo?.pause();
      promiseStage?.classList.remove("is-video-ready", "is-video-error", "is-video-active");
      videoPreloadObserver?.disconnect();
      window.cancelAnimationFrame(videoSeekFrame);
      if (videoSeekTimer) window.clearTimeout(videoSeekTimer);
      context.revert();
    };
  }, []);

  const scrollToStoryTarget = useCallback((target: string | number) => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
      return;
    }

    window.scrollTo({ top: target, behavior });
  }, []);

  const makeWish = () => {
    if (wishMade) return;
    setWishMade(true);
    window.setTimeout(() => document.querySelector("#finale")?.scrollIntoView({ behavior: "smooth", block: "center" }), 1700);
  };

  return (
    <main ref={pageRef} className="birthday-page">
      <div className="scroll-progress" aria-hidden="true" />
      <div className="petal-field" aria-hidden="true">
        {petals.map((petal) => (
          <span className="petal" key={petal.id} style={{
            "--left": `${petal.left}%`, "--delay": `${petal.delay}s`, "--duration": `${petal.duration}s`,
            "--drift": `${petal.drift}px`, "--size": `${petal.size}px`,
          } as CSSProperties} />
        ))}
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Back to the beginning"><span className="brand-mark">✦</span><span>Just for you</span></a>
        <nav aria-label="Birthday story navigation"><a href="#memories">Little things</a><a href="#game">Play</a><a href="#notes">Tiny mails</a><a href="#letter">A letter</a></nav>
        <button className="theme-toggle" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "night" : "day"} mode`}>
          <span>{theme === "light" ? "☾" : "☼"}</span><span className="theme-label">{theme === "light" ? "Moonlight" : "Sunlight"}</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="hero-kicker">A small corner of the internet • made with a lot of heart</p>
          <h1 className="hero-title" aria-label="Happy Birthday Beautiful"><span>Happy</span><span>Birthday,</span><span className="script-line">beautiful.</span></h1>
          <div className="hero-note">
            <p>Today is yours. So I made you a little world to wander through.</p>
            <button className="round-button" type="button" onClick={() => scrollToStoryTarget("#memories")}>
              <span>Begin</span><span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
        <CakeHero theme={theme} />
        <p className="hero-index" aria-hidden="true">BLOOM / 01</p>
      </section>

      <SwipeStory />

      <section className="intro-section" id="story">
        <p className="eyebrow" data-reveal>Before the cake. Before the candles.</p>
        <h2 data-reveal>There are a few things the universe wanted you to know.</h2>
        <p className="intro-aside" data-reveal>Keep scrolling slowly—the blossoms know the way.</p>
      </section>

      <section className="promise-stage" aria-label="Five birthday truths">
        <div className="promise-video-wrap" aria-hidden="true">
          <video
            ref={promiseVideoRef}
            className="promise-video"
            src="/birthday-tree-scroll-scrub.mp4"
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
          />
          <div className="promise-video-shade" />
        </div>
        <div className="promise-copy">
          <p className="eyebrow">Five little truths / 03</p>
          <div className="truth-stack" aria-hidden="true">{truths.map((truth) => <p className="truth-line" key={truth}>{truth}</p>)}</div>
          <ol className="sr-only">{truths.map((truth) => <li key={truth}>{truth}</li>)}</ol>
          <p className="scroll-whisper">scroll to let the moment unfold</p>
        </div>
      </section>

      <BlossomRush />

      <CatMailJourney theme={theme} />

      <section className="letter-section" id="letter">
        <div className="letter-intro" data-reveal><p className="eyebrow">Something I meant to say / 06</p><h2>Some wishes deserve more than a caption.</h2><p>So this one is folded, sealed, and waiting for you.</p></div>
        <button className="letter-card" type="button" onClick={() => setLetterOpen(true)} aria-haspopup="dialog">
          <span className="letter-stamp">✿</span><span className="letter-to">To: my favorite human</span><span className="letter-open">tap to open ↗</span><span className="letter-flap" aria-hidden="true" />
        </button>
      </section>

      <section className={`wish-section ${wishMade ? "wish-made" : ""}`}>
        <Image className="cake-photo" src="/birthday-cake.jpg" alt="A delicate pink floral birthday cake" fill sizes="100vw" />
        <div className="wish-shade" />
        <div className="wish-copy" data-reveal>
          <p className="eyebrow">One last thing / 07</p><h2>{wishMade ? "The wish is on its way." : "Close your eyes. Make it a good one."}</h2>
          <div className="candle-row" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span className="candle" key={index}><i /></span>)}</div>
          <button className="wish-button" type="button" onClick={makeWish} disabled={wishMade}>{wishMade ? "Wish made ✦" : "Blow out the candles"}</button>
        </div>
        <div className="confetti-burst" aria-hidden="true">
          {confetti.map((piece) => <span key={piece.id} style={{ "--cx": `${piece.x}px`, "--cy": `${piece.y}px`, "--cr": `${piece.rotate}deg`, "--cd": `${piece.delay}s` } as CSSProperties} />)}
        </div>
      </section>

      <section className="finale" id="finale">
        <p className="finale-mark" aria-hidden="true">✦</p><p className="eyebrow" data-reveal>A wish for your next chapter</p>
        <h2 data-reveal>May this year bloom in every direction you dare to grow.</h2>
        <p data-reveal>Happy birthday, beautiful. You deserve a life that feels as lovely as you make everyone else’s.</p>
        <button className="replay-button" type="button" onClick={() => scrollToStoryTarget(0)}>Replay the magic ↑</button>
      </section>

      <footer><span>Made with care, petals & a little stardust.</span><span>Photos via Pexels</span></footer>

      {letterOpen && (
        <div className="letter-modal" role="dialog" aria-modal="true" aria-labelledby="letter-title" onClick={() => setLetterOpen(false)}>
          <article className="open-letter" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setLetterOpen(false)} aria-label="Close letter">×</button>
            <p className="letter-date">On your birthday, and every day after</p><h2 id="letter-title">Dear you,</h2>
            <p>I hope this year brings you slow mornings, brave ideas, loud laughter, and the kind of happiness that stays long after the candles go out.</p>
            <p>Thank you for being wonderfully, unmistakably you. Never make yourself smaller for a world that needs exactly your kind of light.</p>
            <p>Here’s to every beautiful thing still finding its way to you.</p>
            <p className="letter-signoff">Always cheering for you,<br /><em>someone very lucky to know you ♡</em></p>
          </article>
        </div>
      )}
    </main>
  );
}
