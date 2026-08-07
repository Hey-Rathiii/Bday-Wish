"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

type GameStatus = "idle" | "playing" | "won" | "lost";
type DropKind = "blossom" | "heart" | "golden" | "cloud";

type GameDrop = {
  id: number;
  kind: DropKind;
  left: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
};

const GAME_SECONDS = 30;
const TARGET_SCORE = 30;
const STARTING_LIVES = 3;
const HIGH_SCORE_KEY = "birthday-blossom-rush-best-v1";

const dropDetails: Record<DropKind, { symbol: string; points: number; label: string }> = {
  blossom: { symbol: "✿", points: 1, label: "pink blossom" },
  heart: { symbol: "♥", points: 2, label: "heart" },
  golden: { symbol: "✦", points: 5, label: "golden blossom" },
  cloud: { symbol: "☁", points: 0, label: "storm cloud" },
};

const celebrationPieces = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  x: `${5 + ((index * 37) % 90)}%`,
  delay: `${(index % 7) * 0.08}s`,
  duration: `${2.4 + (index % 5) * 0.35}s`,
}));

function createDrop(id: number): GameDrop {
  const roll = Math.random();
  const kind: DropKind = roll < 0.13 ? "cloud" : roll < 0.24 ? "golden" : roll < 0.46 ? "heart" : "blossom";

  return {
    id,
    kind,
    left: 7 + Math.random() * 86,
    duration: 4.6 + Math.random() * 2.4,
    drift: -42 + Math.random() * 84,
    spin: -160 + Math.random() * 420,
    size: kind === "cloud" ? 42 + Math.random() * 12 : 30 + Math.random() * 17,
  };
}

export function BlossomRush() {
  const boardRef = useRef<HTMLDivElement>(null);
  const nextDropId = useRef(0);
  const caughtDropIds = useRef(new Set<number>());
  const scoreRef = useRef(0);

  const [status, setStatus] = useState<GameStatus>("idle");
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [drops, setDrops] = useState<GameDrop[]>([]);
  const [basketX, setBasketX] = useState(50);
  const [pulse, setPulse] = useState(false);
  const [announcement, setAnnouncement] = useState("The garden is waiting.");

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
    if (Number.isFinite(saved) && saved > 0) setHighScore(saved);
  }, []);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const finishGame = useCallback((result: "won" | "lost", message: string) => {
    setStatus(result);
    setPaused(false);
    setAnnouncement(message);
  }, []);

  const catchDrop = useCallback((id: number, kind: DropKind) => {
    if (caughtDropIds.current.has(id)) return;
    caughtDropIds.current.add(id);
    setDrops((current) => current.filter((drop) => drop.id !== id));

    if (kind === "cloud") {
      setLives((current) => {
        const nextLives = Math.max(0, current - 1);
        setAnnouncement(nextLives === 0 ? "The clouds won this round." : `Storm cloud! ${nextLives} hearts left.`);
        if (nextLives === 0) finishGame("lost", "The clouds won this round—but the garden always gives second chances.");
        return nextLives;
      });
      return;
    }

    const details = dropDetails[kind];
    setScore((current) => {
      const nextScore = current + details.points;
      scoreRef.current = nextScore;
      setHighScore((currentBest) => {
        const nextBest = Math.max(currentBest, nextScore);
        if (nextBest !== currentBest) window.localStorage.setItem(HIGH_SCORE_KEY, String(nextBest));
        return nextBest;
      });
      setAnnouncement(`${details.label} caught—plus ${details.points}!`);
      if (nextScore >= TARGET_SCORE) finishGame("won", "You filled the garden with birthday magic!");
      return nextScore;
    });
  }, [finishGame]);

  useEffect(() => {
    if (status !== "playing" || paused) return;

    const spawn = () => {
      const nextDrop = createDrop(nextDropId.current++);
      setDrops((current) => [...current.slice(-11), nextDrop]);
    };

    spawn();
    const spawnTimer = window.setInterval(spawn, 610);
    return () => window.clearInterval(spawnTimer);
  }, [paused, status]);

  useEffect(() => {
    if (status !== "playing" || paused) return;

    const clock = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          const won = scoreRef.current >= TARGET_SCORE;
          finishGame(won ? "won" : "lost", won
            ? "You filled the garden with birthday magic!"
            : "Time floated away—but every blossom you caught still counts.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(clock);
  }, [finishGame, paused, status]);

  useEffect(() => {
    if (status !== "playing" || paused) return;

    const collisionCheck = window.setInterval(() => {
      const board = boardRef.current;
      const basket = board?.querySelector<HTMLElement>("[data-game-basket]");
      if (!board || !basket) return;

      const basketRect = basket.getBoundingClientRect();
      board.querySelectorAll<HTMLElement>("[data-drop-id]").forEach((element) => {
        const dropRect = element.getBoundingClientRect();
        const overlaps = dropRect.right > basketRect.left + 8
          && dropRect.left < basketRect.right - 8
          && dropRect.bottom > basketRect.top + 8
          && dropRect.top < basketRect.bottom;

        if (overlaps) {
          catchDrop(Number(element.dataset.dropId), element.dataset.dropKind as DropKind);
        }
      });
    }, 70);

    return () => window.clearInterval(collisionCheck);
  }, [catchDrop, paused, status]);

  const startGame = () => {
    caughtDropIds.current.clear();
    scoreRef.current = 0;
    setScore(0);
    setLives(STARTING_LIVES);
    setTimeLeft(GAME_SECONDS);
    setDrops([]);
    setBasketX(50);
    setPaused(false);
    setStatus("playing");
    setAnnouncement("Blossom Rush has begun!");
    window.setTimeout(() => boardRef.current?.focus(), 80);
  };

  const moveBasket = (event: PointerEvent<HTMLDivElement>) => {
    if (status !== "playing" || paused) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = ((event.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.min(94, Math.max(6, percentage)));
  };

  const magnetPulse = () => {
    if (status !== "playing" || paused) return;
    setPulse(true);
    window.setTimeout(() => setPulse(false), 260);

    const board = boardRef.current;
    const basket = board?.querySelector<HTMLElement>("[data-game-basket]");
    if (!board || !basket) return;
    const basketRect = basket.getBoundingClientRect();

    const candidates = Array.from(board.querySelectorAll<HTMLElement>("[data-drop-id]"))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ element, rect }) => element.dataset.dropKind !== "cloud"
        && rect.bottom > board.getBoundingClientRect().top + board.clientHeight * 0.4)
      .sort((a, b) => Math.abs((a.rect.left + a.rect.right) / 2 - (basketRect.left + basketRect.right) / 2)
        - Math.abs((b.rect.left + b.rect.right) / 2 - (basketRect.left + basketRect.right) / 2));

    const closest = candidates[0];
    if (closest && Math.abs((closest.rect.left + closest.rect.right) / 2 - (basketRect.left + basketRect.right) / 2) < 135) {
      catchDrop(Number(closest.element.dataset.dropId), closest.element.dataset.dropKind as DropKind);
    }
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      setBasketX((current) => Math.min(94, Math.max(6, current + direction * 6)));
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      magnetPulse();
    }
    if (event.key.toLowerCase() === "p") setPaused((current) => !current);
  };

  const progress = Math.min(100, (score / TARGET_SCORE) * 100);

  return (
    <section className={`game-section game-${status} ${paused ? "is-paused" : ""}`} id="game" aria-labelledby="game-title">
      <div className="game-stars" aria-hidden="true" />
      <div className="game-heading" data-reveal>
        <p className="eyebrow">A playful detour / 04</p>
        <h2 id="game-title">Catch a little<br /><em>birthday magic.</em></h2>
        <p>Guide the moonlit basket, gather blossoms, and keep the storm clouds away.</p>
      </div>

      <div className="game-shell" data-reveal>
        {status === "idle" ? (
          <div className="game-intro">
            <div className="game-gift" aria-hidden="true">
              <span className="gift-glow" />
              <span className="gift-bow">✦</span>
              <span className="gift-box">🌸</span>
            </div>
            <div className="game-intro-copy">
              <span className="game-overline">Your final gift has a game inside</span>
              <h3>Blossom Rush</h3>
              <p>You have 30 seconds to fill the magic meter. Move the basket with your pointer or arrow keys, and tap falling treasures for an extra boost.</p>
              <div className="game-legend" aria-label="Game scoring">
                <span><b>✿</b> +1</span><span><b>♥</b> +2</span><span><b>✦</b> +5</span><span><b>☁</b> lose a heart</span>
              </div>
              <button className="game-start" type="button" onClick={startGame}><span>Open the game</span><span aria-hidden="true">↗</span></button>
              {highScore > 0 ? <p className="game-best">Best magic so far: <strong>{highScore}</strong></p> : null}
            </div>
          </div>
        ) : (
          <div className="game-play">
            <div className="game-hud">
              <div><span>Magic</span><strong>{score}<small> / {TARGET_SCORE}</small></strong></div>
              <div className="game-meter" aria-label={`${Math.round(progress)} percent of magic collected`}><span style={{ width: `${progress}%` }} /></div>
              <div><span>Time</span><strong>{timeLeft}<small>s</small></strong></div>
              <div><span>Hearts</span><strong className="game-lives" aria-label={`${lives} hearts remaining`}>{"♥".repeat(lives)}<i>{"♡".repeat(STARTING_LIVES - lives)}</i></strong></div>
              {status === "playing" ? <button className="game-pause" type="button" onClick={() => setPaused((current) => !current)}>{paused ? "Resume" : "Pause"}</button> : null}
            </div>

            <div
              className={`game-board ${pulse ? "basket-pulse" : ""}`}
              ref={boardRef}
              role="application"
              tabIndex={0}
              aria-label="Blossom Rush game board. Move with the left and right arrow keys. Press Space to pull in a nearby blossom. Press P to pause."
              onKeyDown={handleKeyboard}
              onPointerMove={moveBasket}
            >
              <div className="game-moon" aria-hidden="true" />
              <div className="game-hills" aria-hidden="true" />
              {drops.map((drop) => {
                const details = dropDetails[drop.kind];
                return (
                  <span
                    className={`game-drop drop-${drop.kind}`}
                    data-drop-id={drop.id}
                    data-drop-kind={drop.kind}
                    key={drop.id}
                    onAnimationEnd={() => setDrops((current) => current.filter((item) => item.id !== drop.id))}
                    onPointerDown={() => catchDrop(drop.id, drop.kind)}
                    style={{
                      "--drop-left": `${drop.left}%`,
                      "--drop-duration": `${drop.duration}s`,
                      "--drop-drift": `${drop.drift}px`,
                      "--drop-spin": `${drop.spin}deg`,
                      "--drop-size": `${drop.size}px`,
                    } as CSSProperties}
                    aria-hidden="true"
                  >{details.symbol}</span>
                );
              })}
              <div className="game-basket" data-game-basket style={{ "--basket-x": `${basketX}%` } as CSSProperties} aria-hidden="true">
                <span>✿</span><i />
              </div>
              {paused ? <div className="game-paused"><span>Moonlight paused</span><small>Press P or tap Resume</small></div> : null}
              {status === "won" || status === "lost" ? (
                <div className={`game-result result-${status}`}>
                  <span className="result-mark" aria-hidden="true">{status === "won" ? "✦" : "☾"}</span>
                  <p>{status === "won" ? "The secret wish has bloomed" : "The garden is still cheering for you"}</p>
                  <h3>{status === "won" ? "You caught the magic." : `${score} pieces of magic found.`}</h3>
                  <p className="result-copy">{status === "won" ? "May every lovely thing you caught find its way back to you this year." : "Some wishes take another try. The blossoms are ready when you are."}</p>
                  <div className="result-actions">
                    <button type="button" onClick={startGame}>{status === "won" ? "Play again" : "Try again"}</button>
                    <button type="button" onClick={() => document.querySelector("#letter")?.scrollIntoView({ behavior: "smooth" })}>Continue to the letter ↓</button>
                  </div>
                </div>
              ) : null}
              {status === "won" ? <div className="game-celebration" aria-hidden="true">{celebrationPieces.map((piece) => <span key={piece.id} style={{ "--piece-x": piece.x, "--piece-delay": piece.delay, "--piece-duration": piece.duration } as CSSProperties} />)}</div> : null}
            </div>

            <div className="game-help">
              <span><kbd>←</kbd><kbd>→</kbd> move</span><span><kbd>Space</kbd> magic pull</span><span>Pointer / touch follows you</span><span>Best: <strong>{Math.max(highScore, score)}</strong></span>
            </div>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </section>
  );
}
