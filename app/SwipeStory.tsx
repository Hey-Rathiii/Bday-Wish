"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const slides = [
  {
    number: "01",
    eyebrow: "Soft strength",
    title: "You make grace look fearless.",
    copy: "There is something beautiful about the way you stay gentle without ever becoming small.",
    accent: "#f6a8c1",
  },
  {
    number: "02",
    eyebrow: "Joy, generously",
    title: "You make happiness feel at home.",
    copy: "The kind of warmth that enters a room before you say a word and lingers after you leave.",
    accent: "#ffd58c",
  },
  {
    number: "03",
    eyebrow: "Everyday magic",
    title: "Keep becoming, entirely you.",
    copy: "The loveliest things bloom quietly. This next chapter gets to open in every direction you dare to grow.",
    accent: "#d9b9ff",
  },
] as const;

const cssBlossoms = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  x: 8 + ((index * 37) % 86),
  y: 7 + ((index * 53) % 53),
  size: 18 + (index % 5) * 7,
  rotate: (index * 47) % 360,
  delay: -((index * 0.31) % 4),
}));

const driftingPetals = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  x: 4 + ((index * 41) % 92),
  y: 9 + ((index * 29) % 76),
  size: 7 + (index % 4) * 3,
  delay: -((index * 0.73) % 8),
  duration: 7 + (index % 5) * 1.3,
}));

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getReducedMotionSnapshot = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotionSnapshot = () => false;

type SwipeStoryProps = {
  onCaptureChange?: (captured: boolean, scrollTarget?: number) => void;
};

type Direction = -1 | 1;
type GoToSlide = (index: number, direction: Direction) => void;

export function SwipeStory({ onCaptureChange }: SwipeStoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const goToSlideRef = useRef<GoToSlide | null>(null);
  const requestAdjacentRef = useRef<((direction: Direction) => void) | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(activeIndex);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const panels = gsap.utils.toArray<HTMLElement>(".swipe-story__panel", root);
    const outerWrappers = gsap.utils.toArray<HTMLElement>(".swipe-story__outer", root);
    const innerWrappers = gsap.utils.toArray<HTMLElement>(".swipe-story__inner", root);
    const backgrounds = gsap.utils.toArray<HTMLElement>(".swipe-story__background", root);
    const headings = gsap.utils.toArray<HTMLElement>(".swipe-story__headline", root);
    if (reducedMotion) {
      root.classList.add("is-reduced-motion");

      return () => {
        root.classList.remove("is-reduced-motion");
        goToSlideRef.current = null;
        requestAdjacentRef.current = null;
      };
    }

    gsap.registerPlugin(Observer, ScrollTrigger, SplitText);

    const splitHeadings: SplitText[] = [];
    const initialIndex = Math.min(activeIndexRef.current, panels.length - 1);
    let currentIndex = initialIndex;
    let animating = false;
    let queuedDirection: Direction | null = null;
    let captureActive = false;
    let activeTimeline: gsap.core.Timeline | null = null;
    let gestureObserver: Observer | null = null;
    let pinTrigger: ScrollTrigger | null = null;

    const context = gsap.context(() => {
      headings.forEach((heading) => {
        splitHeadings.push(SplitText.create(heading, {
          type: "chars,words,lines",
          linesClass: "swipe-story__line",
          aria: "auto",
        }));
      });

      gsap.set(panels, { autoAlpha: 0, zIndex: 0 });
      gsap.set(outerWrappers, { yPercent: 100 });
      gsap.set(innerWrappers, { yPercent: -100 });
      gsap.set(backgrounds, { yPercent: 0, scale: 1.06 });
      gsap.set(panels[initialIndex], { autoAlpha: 1, zIndex: 1 });
      gsap.set([outerWrappers[initialIndex], innerWrappers[initialIndex]], { yPercent: 0 });
      gsap.set(splitHeadings[initialIndex]?.chars ?? [], { autoAlpha: 1, yPercent: 0 });
    }, root);

    const setCurrentIndex = (nextIndex: number) => {
      currentIndex = nextIndex;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    };

    const prepareLanding = (nextIndex: number) => {
      if (nextIndex === currentIndex) return;

      activeTimeline?.kill();
      animating = false;
      gsap.set(panels, { autoAlpha: 0, zIndex: 0 });
      gsap.set(outerWrappers, { yPercent: 100 });
      gsap.set(innerWrappers, { yPercent: -100 });
      gsap.set(backgrounds, { yPercent: 0, scale: 1.06 });
      gsap.set(panels[nextIndex], { autoAlpha: 1, zIndex: 1 });
      gsap.set([outerWrappers[nextIndex], innerWrappers[nextIndex]], { yPercent: 0 });
      gsap.set(splitHeadings[nextIndex]?.chars ?? [], { autoAlpha: 1, yPercent: 0 });
      setCurrentIndex(nextIndex);
    };

    const goToSection: GoToSlide = (nextIndex, direction) => {
      if (animating || nextIndex === currentIndex || nextIndex < 0 || nextIndex >= panels.length) return;

      animating = true;
      activeTimeline?.kill();

      const previousIndex = currentIndex;
      const directionFactor = direction === -1 ? -1 : 1;
      const nextChars = splitHeadings[nextIndex]?.chars ?? [];

      gsap.set(panels[previousIndex], { zIndex: 1 });
      gsap.set(panels[nextIndex], { autoAlpha: 1, zIndex: 2 });

      activeTimeline = gsap.timeline({
        defaults: { duration: 1.05, ease: "power1.inOut" },
        onComplete: () => {
          gsap.set(panels[previousIndex], { autoAlpha: 0, zIndex: 0 });
          animating = false;
          if (queuedDirection !== null) {
            const direction = queuedDirection;
            queuedDirection = null;
            requestAdjacentRef.current?.(direction);
          }
        },
      })
        .to(backgrounds[previousIndex], {
          yPercent: -14 * directionFactor,
          scale: 1.13,
        }, 0)
        .fromTo(
          [outerWrappers[nextIndex], innerWrappers[nextIndex]],
          {
            yPercent: (wrapperIndex: number) => wrapperIndex
              ? -100 * directionFactor
              : 100 * directionFactor,
          },
          { yPercent: 0 },
          0,
        )
        .fromTo(
          backgrounds[nextIndex],
          { yPercent: 15 * directionFactor, scale: 1.16 },
          { yPercent: 0, scale: 1.06 },
          0,
        )
        .fromTo(
          nextChars,
          { autoAlpha: 0, yPercent: 150 * directionFactor },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: { each: 0.016, from: "random" },
          },
          0.16,
        );

      setCurrentIndex(nextIndex);
    };

    goToSlideRef.current = goToSection;

    const setCaptured = (captured: boolean, scrollTarget?: number) => {
      if (captureActive === captured && scrollTarget === undefined) return;
      captureActive = captured;
      root.classList.toggle("is-observing", captured);

      if (captured) {
        onCaptureChange?.(true, scrollTarget);
        gestureObserver?.enable();
      } else {
        gestureObserver?.disable();
        onCaptureChange?.(false, scrollTarget);
      }
    };

    const releaseToPage = (direction: Direction) => {
      if (!pinTrigger) return;
      const destination = direction === 1 ? pinTrigger.end + 2 : pinTrigger.start - 2;
      setCaptured(false, destination);
    };

    const requestAdjacent = (direction: Direction) => {
      if (animating) {
        queuedDirection = direction;
        return;
      }

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= panels.length) {
        releaseToPage(direction);
        return;
      }

      goToSection(nextIndex, direction);
    };

    requestAdjacentRef.current = requestAdjacent;

    gestureObserver = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      dragMinimum: 10,
      tolerance: 24,
      lockAxis: true,
      preventDefault: true,
      allowClicks: true,
      ignore: ".swipe-story__controls",
      onDown: () => requestAdjacent(-1),
      onUp: () => requestAdjacent(1),
    });
    gestureObserver.disable();

    pinTrigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "+=200",
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 20,
      onEnter: (self) => {
        prepareLanding(0);
        setCaptured(true, self.start + 1);
      },
      onEnterBack: (self) => {
        prepareLanding(panels.length - 1);
        setCaptured(true, self.end - 1);
      },
      onLeave: () => {
        if (captureActive) setCaptured(false);
      },
      onLeaveBack: () => {
        if (captureActive) setCaptured(false);
      },
    });

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh(true);
    });

    return () => {
      goToSlideRef.current = null;
      requestAdjacentRef.current = null;
      window.cancelAnimationFrame(refreshFrame);
      if (captureActive) setCaptured(false);
      pinTrigger?.kill();
      gestureObserver?.kill();
      activeTimeline?.kill();
      queuedDirection = null;
      context.revert();
      splitHeadings.forEach((split) => split.revert());
    };
  }, [onCaptureChange, reducedMotion]);

  const goToSlide = (index: number) => {
    const direction: Direction = index < activeIndex ? -1 : 1;
    goToSlideRef.current?.(index, direction);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      if (!requestAdjacentRef.current) return;
      event.preventDefault();
      requestAdjacentRef.current(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      if (!requestAdjacentRef.current) return;
      event.preventDefault();
      requestAdjacentRef.current(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  };

  return (
    <section
      ref={rootRef}
      className="swipe-story"
      id="memories"
      aria-label="A finite gallery of things that feel like you"
      aria-roledescription="carousel"
    >
      <div className="swipe-story__viewport">
        <div className="swipe-story__topline" aria-hidden="true">
          <span>A tiny museum / 02</span>
          <span>Three moments · one way through</span>
        </div>

        <div className="swipe-story__panels">
          {slides.map((slide, index) => (
            <article
              className="swipe-story__panel"
              key={slide.number}
              aria-hidden={!reducedMotion && activeIndex !== index}
              style={{ "--swipe-accent": slide.accent } as CSSProperties}
            >
              <div className="swipe-story__outer">
                <div className="swipe-story__inner">
                  <div className="swipe-story__background" data-scene={index + 1}>
                    <div className="swipe-story__css-scene" aria-hidden="true">
                      <span className="swipe-story__moon" />
                      <div className="swipe-story__branch-system">
                        <span className="swipe-story__branch swipe-story__branch--main" />
                        <span className="swipe-story__branch swipe-story__branch--high" />
                        <span className="swipe-story__branch swipe-story__branch--low" />
                      </div>
                      <div className="swipe-story__cherry-field">
                        {cssBlossoms.map((blossom) => (
                          <span
                            className="swipe-story__blossom"
                            key={blossom.id}
                            style={{
                              "--blossom-x": `${blossom.x}%`,
                              "--blossom-y": `${blossom.y}%`,
                              "--blossom-size": `${blossom.size}px`,
                              "--blossom-rotate": `${blossom.rotate}deg`,
                              "--blossom-delay": `${blossom.delay}s`,
                            } as CSSProperties}
                          />
                        ))}
                      </div>
                      <div className="swipe-story__petal-drift">
                        {driftingPetals.map((petal) => (
                          <span
                            key={petal.id}
                            style={{
                              "--petal-x": `${petal.x}%`,
                              "--petal-y": `${petal.y}%`,
                              "--petal-size": `${petal.size}px`,
                              "--petal-delay": `${petal.delay}s`,
                              "--petal-duration": `${petal.duration}s`,
                            } as CSSProperties}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="swipe-story__shade" />
                    <span className="swipe-story__ghost-number" aria-hidden="true">{slide.number}</span>
                    <div className="swipe-story__content">
                      <p className="swipe-story__eyebrow">{slide.eyebrow} / {slide.number}</p>
                      <h2 className="swipe-story__headline">{slide.title}</h2>
                      <p className="swipe-story__copy">{slide.copy}</p>
                      <small>A little world drawn entirely in blossoms</small>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="swipe-story__side-cue" aria-hidden="true">
          <span />
          <p>Swipe through three little things</p>
        </div>

        <div className="swipe-story__controls">
          <button
            type="button"
            className="swipe-story__arrow"
            onClick={() => goToSlide(activeIndex - 1)}
            onKeyDown={handleKeyDown}
            aria-label="Show previous memory"
            disabled={activeIndex === 0}
          >
            <span aria-hidden="true">↑</span>
          </button>

          <div className="swipe-story__dots" aria-label="Choose a memory">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.number}
                className="swipe-story__dot"
                aria-label={`Show memory ${index + 1}: ${slide.eyebrow}`}
                aria-current={activeIndex === index ? "true" : undefined}
                onClick={() => goToSlide(index)}
                onKeyDown={handleKeyDown}
              >
                <span />
              </button>
            ))}
          </div>

          <p className="swipe-story__counter" aria-live="polite">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <i />
            <span>{String(slides.length).padStart(2, "0")}</span>
          </p>

          <button
            type="button"
            className="swipe-story__arrow"
            onClick={() => goToSlide(activeIndex + 1)}
            onKeyDown={handleKeyDown}
            aria-label="Show next memory"
            disabled={activeIndex === slides.length - 1}
          >
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
