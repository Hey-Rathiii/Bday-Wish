"use client";

import { useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const moments = [
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

const blossoms = [
  [9, 12, 18], [22, 20, 24], [53, 10, 15], [83, 17, 21],
  [12, 38, 14], [88, 40, 19], [7, 63, 17], [92, 66, 14],
  [17, 79, 19], [79, 77, 16], [55, 31, 12],
].map(([x, y, size], index) => ({ id: index, x, y, size, rotate: (index * 47) % 360 }));

const petals = [
  [16, 28, 8], [88, 31, 10], [12, 53, 9], [86, 58, 7], [25, 88, 8],
].map(([x, y, size], index) => ({ id: index, x, y, size, delay: -(index * .73) }));

export function SwipeStory() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".swipe-story__card").forEach((card, index) => {
        gsap.fromTo(card,
          { autoAlpha: 0, y: 42, rotate: index === 1 ? 0 : index === 0 ? -1.5 : 1.5 },
          {
            autoAlpha: 1,
            y: 0,
            rotate: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section ref={rootRef} className="swipe-story" id="memories" aria-labelledby="little-things-title">
      <div className="swipe-story__intro">
        <p className="swipe-story__kicker">A tiny museum / 02</p>
        <h2 id="little-things-title">Three little things I hope you always remember.</h2>
        <p>There is no trick here—just three moments made to move with you, never hold you back.</p>
      </div>

      <div className="swipe-story__cards">
        {moments.map((moment, index) => (
          <article
            className="swipe-story__card"
            key={moment.number}
            style={{ "--swipe-accent": moment.accent } as CSSProperties}
          >
            <div className="swipe-story__scene" data-scene={index + 1} aria-hidden="true">
              <span className="swipe-story__moon" />
              <div className="swipe-story__branch-system">
                <span className="swipe-story__branch swipe-story__branch--main" />
                <span className="swipe-story__branch swipe-story__branch--high" />
                <span className="swipe-story__branch swipe-story__branch--low" />
              </div>
              <div className="swipe-story__cherry-field">
                {blossoms.map((blossom) => (
                  <span
                    className="swipe-story__blossom"
                    key={blossom.id}
                    style={{
                      "--blossom-x": `${blossom.x}%`,
                      "--blossom-y": `${blossom.y}%`,
                      "--blossom-size": `${blossom.size}px`,
                      "--blossom-rotate": `${blossom.rotate}deg`,
                    } as CSSProperties}
                  />
                ))}
              </div>
              <div className="swipe-story__petal-drift">
                {petals.map((petal) => (
                  <span
                    key={petal.id}
                    style={{
                      "--petal-x": `${petal.x}%`,
                      "--petal-y": `${petal.y}%`,
                      "--petal-size": `${petal.size}px`,
                      "--petal-delay": `${petal.delay}s`,
                    } as CSSProperties}
                  />
                ))}
              </div>
            </div>

            <span className="swipe-story__number" aria-hidden="true">{moment.number}</span>
            <div className="swipe-story__content">
              <p className="swipe-story__eyebrow">{moment.eyebrow}</p>
              <h3>{moment.title}</h3>
              <p>{moment.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
