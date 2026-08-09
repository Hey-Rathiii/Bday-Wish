"use client";

import { ContactShadows, PerspectiveCamera as DreiPerspectiveCamera, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Group, InstancedMesh, PointLight } from "three";
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  MathUtils,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { CakeSceneProps } from "./CakeHero";

const CANDLE_COLORS = ["#78ddeb", "#f49abb", "#9ddba5", "#ffd17a", "#8fd6f2", "#a6dfa9", "#f7a1c1"];
const CANDLE_POSITIONS: [number, number][] = [
  [-1.34, -0.06],
  [-0.92, 0.22],
  [-0.47, -0.08],
  [0, 0.28],
  [0.47, -0.08],
  [0.92, 0.22],
  [1.34, -0.06],
];
const SPRINKLE_COLORS = ["#ff769f", "#ffd75f", "#6fd8d0", "#a98ce7", "#fca96f"];
const BOTTOM_DRIPS = [0.28, 0.5, 0.35, 0.62, 0.4, 0.3, 0.56, 0.38, 0.66, 0.34, 0.46, 0.3];
const TOP_DRIPS = [0.26, 0.42, 0.32, 0.5, 0.28, 0.38, 0.52, 0.3, 0.44, 0.34, 0.48];

type PearlTransform = {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

function smoothstep(value: number, min: number, max: number) {
  return MathUtils.smoothstep(value, min, max);
}

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function SceneCamera() {
  const compact = useThree((state) => state.size.width < 480);
  return (
    <DreiPerspectiveCamera
      makeDefault
      far={100}
      fov={compact ? 40 : 37}
      near={0.1}
      position={[0, 0.45, compact ? 12.6 : 11.2]}
      rotation={[-0.03, 0, 0]}
    />
  );
}

function SceneLights({ scrollProgress, theme }: Pick<CakeSceneProps, "scrollProgress" | "theme">) {
  const candleLightRef = useRef<PointLight>(null);

  useFrame((_, delta) => {
    if (!candleLightRef.current) return;
    const target = 1.5 + smoothstep(scrollProgress.current, 0.08, 0.48) * (theme === "dark" ? 23 : 16);
    candleLightRef.current.intensity = MathUtils.damp(candleLightRef.current.intensity, target, 5, delta);
  });

  return (
    <>
      <hemisphereLight args={[theme === "dark" ? "#ffd8e6" : "#fff9f1", theme === "dark" ? "#16091d" : "#a57682", theme === "dark" ? 1.5 : 1.8]} />
      <directionalLight
        castShadow
        color={theme === "dark" ? "#ffd6bd" : "#fff7e6"}
        intensity={theme === "dark" ? 2.5 : 3.2}
        position={[5.5, 8, 7]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
        shadow-camera-far={24}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={6}
        shadow-camera-bottom={-5}
      />
      <pointLight color="#ff87bd" intensity={theme === "dark" ? 13 : 8} position={[-4, 2, -1.5]} distance={11} />
      <pointLight ref={candleLightRef} color="#ff9f45" intensity={1.5} position={[0, 3.15, 2.1]} distance={8} decay={2} />
    </>
  );
}

function FrostingLayer({ drips, radius, y }: { drips: number[]; radius: number; y: number }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, y, 0]}>
        <cylinderGeometry args={[radius, radius + 0.025, 0.34, 64]} />
        <meshPhysicalMaterial color="#f58eae" roughness={0.23} clearcoat={0.32} clearcoatRoughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, y - 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius - 0.105, 0.155, 12, 64]} />
        <meshPhysicalMaterial color="#f58eae" roughness={0.23} clearcoat={0.32} clearcoatRoughness={0.25} />
      </mesh>
      {drips.map((length, index) => {
        const angle = (index / drips.length) * Math.PI * 2 + 0.18;
        const frontFactor = Math.max(0.72, 1 - Math.max(0, Math.sin(angle)) * 0.18);
        return (
          <mesh
            castShadow
            key={`${radius}-${index}`}
            position={[
              Math.cos(angle) * (radius - 0.015),
              y - 0.23 - length * 0.16,
              Math.sin(angle) * (radius - 0.015),
            ]}
            scale={[0.9, (1 + length * 2.3) * frontFactor, 0.78]}
          >
            <sphereGeometry args={[0.18, 14, 12]} />
            <meshPhysicalMaterial color="#f58eae" roughness={0.23} clearcoat={0.32} clearcoatRoughness={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function CakeFace() {
  return (
    <group>
      {[-0.52, 0.52].map((x, index) => (
        <group key={x}>
          <mesh castShadow position={[x, 0.43, 1.94]}>
            <sphereGeometry args={[0.23, 24, 20]} />
            <meshStandardMaterial color="#3b1f2a" roughness={0.23} />
          </mesh>
          <mesh position={[x + 0.07, 0.51, 2.13]}>
            <sphereGeometry args={[0.064, 16, 12]} />
            <meshBasicMaterial color="#fffdf8" toneMapped={false} />
          </mesh>
          <mesh
            position={[x, 0.82, 1.95]}
            rotation={[0, 0, index === 0 ? -0.18 : 0.18]}
          >
            <torusGeometry args={[0.2, 0.035, 8, 20, Math.PI * 0.82]} />
            <meshStandardMaterial color="#3b1f2a" roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 2.035]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.35, 0.043, 10, 30, Math.PI]} />
        <meshStandardMaterial color="#3b1f2a" roughness={0.3} />
      </mesh>
      {[-0.92, 0.92].map((x) => (
        <mesh key={x} position={[x, 0.18, 1.79]} scale={[1.2, 0.7, 0.45]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshStandardMaterial color="#f69db0" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function PearlInstances({ color, items }: { color: string; items: PearlTransform[] }) {
  const pearlRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = pearlRef.current;
    if (!mesh) return;

    const dummy = new Object3D();
    items.forEach((item, index) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...item.rotation);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={pearlRef} args={[undefined, undefined, items.length]}>
      <sphereGeometry args={[0.062, 10, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

function Sprinkles() {
  const transforms = useMemo(() => {
    return Array.from({ length: 72 }, (_, index) => {
      const onTopTier = index < 40;
      const innerRadius = onTopTier ? 0.28 : 2.04;
      const outerRadius = onTopTier ? 1.82 : 2.49;
      const radiusSeed = seededValue(index, 1);
      const angleSeed = seededValue(index, 2);
      const heightSeed = seededValue(index, 3);
      const rotationX = seededValue(index, 4);
      const rotationY = seededValue(index, 5);
      const rotationZ = seededValue(index, 6);
      const scaleSeed = seededValue(index, 7);
      const radius = onTopTier
        ? Math.sqrt(radiusSeed) * (outerRadius - innerRadius) + innerRadius
        : innerRadius + radiusSeed * (outerRadius - innerRadius);
      const angle = angleSeed * Math.PI * 2;

      return {
        color: SPRINKLE_COLORS[index % SPRINKLE_COLORS.length],
        position: [
          Math.cos(angle) * radius,
          onTopTier ? 1.43 + heightSeed * 0.018 : -0.15 + heightSeed * 0.018,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [rotationX * 0.35, rotationY * Math.PI, rotationZ * Math.PI] as [number, number, number],
        scale: 0.72 + scaleSeed * 0.5,
      };
    });
  }, []);
  const groups = useMemo(
    () => SPRINKLE_COLORS.map((color) => ({ color, items: transforms.filter((item) => item.color === color) })),
    [transforms],
  );

  return (
    <group>
      {groups.map(({ color, items }) => (
        <PearlInstances color={color} items={items} key={color} />
      ))}
    </group>
  );
}

function Flame({ index, reducedMotion, scrollProgress }: Pick<CakeSceneProps, "reducedMotion" | "scrollProgress"> & { index: number }) {
  const flameRef = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const flame = flameRef.current;
    if (!flame) return;
    const reveal = reducedMotion ? 1 : smoothstep(scrollProgress.current, 0.07 + index * 0.047, 0.18 + index * 0.047);
    const flicker = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 8.5 + index * 1.7) * 0.08;
    const targetScale = (0.5 + reveal * 0.5) * flicker;
    const nextScale = MathUtils.damp(flame.scale.x, targetScale, 10, delta);
    flame.scale.set(nextScale, nextScale, nextScale);
    flame.rotation.z = reducedMotion ? 0.08 : Math.sin(clock.elapsedTime * 4.2 + index) * 0.11;
  });

  return (
    <group ref={flameRef} position={[0, 1.28, 0]} scale={0.5}>
      <mesh scale={[0.12, 0.25, 0.12]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshBasicMaterial color="#ff9d32" transparent opacity={0.92} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.035, 0.015]} scale={[0.055, 0.13, 0.055]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshBasicMaterial color="#fff1a8" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Candle({
  color,
  index,
  position,
  reducedMotion,
  scrollProgress,
}: Pick<CakeSceneProps, "reducedMotion" | "scrollProgress"> & {
  color: string;
  index: number;
  position: [number, number];
}) {
  const candleRef = useRef<Group>(null);
  const stripeCurve = useMemo(() => {
    const points = Array.from({ length: 40 }, (_, pointIndex) => {
      const progress = pointIndex / 39;
      const angle = progress * Math.PI * 4.25;
      return new Vector3(Math.cos(angle) * 0.091, 0.055 + progress * 0.94, Math.sin(angle) * 0.091);
    });
    return new CatmullRomCurve3(points);
  }, []);

  useFrame((_, delta) => {
    if (!candleRef.current) return;
    const reveal = reducedMotion ? 1 : 0.82 + smoothstep(scrollProgress.current, 0.02 + index * 0.025, 0.24 + index * 0.025) * 0.18;
    candleRef.current.scale.y = MathUtils.damp(candleRef.current.scale.y, reveal, 6, delta);
  });

  return (
    <group ref={candleRef} position={[position[0], 1.34, position[1]]} scale={[1, 0.82, 1]}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.04, 18]} />
        <meshStandardMaterial color={color} roughness={0.34} />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[stripeCurve, 48, 0.014, 6, false]} />
        <meshStandardMaterial color="#fff8ec" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.085, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.15, 8]} />
        <meshStandardMaterial color="#4a2c31" roughness={0.9} />
      </mesh>
      <Flame index={index} reducedMotion={reducedMotion} scrollProgress={scrollProgress} />
    </group>
  );
}

function CakeModel({ reducedMotion, scrollProgress }: Pick<CakeSceneProps, "reducedMotion" | "scrollProgress">) {
  const cakeRef = useRef<Group>(null);
  const { size } = useThree();

  useFrame((state, delta) => {
    const cake = cakeRef.current;
    if (!cake) return;

    const progress = reducedMotion ? 0.78 : scrollProgress.current;
    const entry = reducedMotion ? 1 : smoothstep(state.clock.elapsedTime, 0.05, 1.25);
    const compact = size.width < 480;
    const baseScale = compact ? 0.72 : 0.86;
    const firstTurn = MathUtils.lerp(-0.3, 0.76, smoothstep(progress, 0, 0.66));
    const scrollTurn = progress < 0.66 ? firstTurn : MathUtils.lerp(0.76, 0.08, smoothstep(progress, 0.66, 1));
    const pointerX = reducedMotion ? 0 : state.pointer.x * 0.12;
    const pointerY = reducedMotion ? 0 : state.pointer.y * 0.055;
    const idle = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.15) * 0.055;
    const targetScale = baseScale * (0.72 + entry * 0.28) * (1 + progress * 0.1);

    cake.rotation.y = MathUtils.damp(cake.rotation.y, scrollTurn + pointerX, 4.5, delta);
    cake.rotation.x = MathUtils.damp(cake.rotation.x, -0.03 - pointerY + progress * 0.055, 4, delta);
    cake.rotation.z = MathUtils.damp(cake.rotation.z, reducedMotion ? 0 : state.pointer.x * -0.015, 4, delta);
    cake.position.y = MathUtils.damp(cake.position.y, -0.48 + entry * 0.48 + progress * 0.42 + idle, 4, delta);
    cake.position.x = MathUtils.damp(cake.position.x, progress * 0.08, 4, delta);
    const nextScale = MathUtils.damp(cake.scale.x, targetScale, 4.5, delta);
    cake.scale.setScalar(nextScale);
  });

  return (
    <group ref={cakeRef} position={[0, -0.48, 0]} rotation={[-0.03, -0.3, 0]} scale={0.62}>
      <mesh castShadow receiveShadow position={[0, -2.23, 0]}>
        <cylinderGeometry args={[3.35, 3.18, 0.18, 64]} />
        <meshPhysicalMaterial color="#f3ead9" roughness={0.24} clearcoat={0.22} />
      </mesh>
      <mesh position={[0, -2.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.08, 0.12, 10, 64]} />
        <meshStandardMaterial color="#ddcaa9" roughness={0.38} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -1.32, 0]}>
        <cylinderGeometry args={[2.62, 2.64, 1.72, 64]} />
        <meshStandardMaterial color="#efc58f" roughness={0.58} />
      </mesh>
      <mesh position={[0, -1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.635, 0.035, 8, 64]} />
        <meshStandardMaterial color="#d8a86f" roughness={0.55} />
      </mesh>
      <FrostingLayer drips={BOTTOM_DRIPS} radius={2.68} y={-0.42} />

      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2.0, 2.02, 1.52, 64]} />
        <meshStandardMaterial color="#f1ca98" roughness={0.56} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.01, 0.028, 8, 64]} />
        <meshStandardMaterial color="#d9aa73" roughness={0.58} />
      </mesh>
      <FrostingLayer drips={TOP_DRIPS} radius={2.08} y={1.2} />
      <CakeFace />
      <Sprinkles />

      {CANDLE_POSITIONS.map((position, index) => (
        <Candle
          color={CANDLE_COLORS[index]}
          index={index}
          key={`${position[0]}-${position[1]}`}
          position={position}
          reducedMotion={reducedMotion}
          scrollProgress={scrollProgress}
        />
      ))}
    </group>
  );
}

function BirthdayScene({ reducedMotion, scrollProgress, theme }: Omit<CakeSceneProps, "active">) {
  return (
    <>
      <SceneCamera />
      <SceneLights scrollProgress={scrollProgress} theme={theme} />
      <Sparkles
        color={theme === "dark" ? "#ffc8dc" : "#fff4bd"}
        count={42}
        noise={[1.2, 1.5, 1.2]}
        opacity={0.72}
        scale={[8, 7, 4]}
        size={2.2}
        speed={reducedMotion ? 0 : 0.22}
      />
      <CakeModel reducedMotion={reducedMotion} scrollProgress={scrollProgress} />
      <ContactShadows
        position={[0, -2.36, 0]}
        opacity={theme === "dark" ? 0.62 : 0.34}
        scale={8.5}
        blur={2.8}
        far={5.8}
        resolution={512}
        frames={1}
        color={theme === "dark" ? "#09040b" : "#704458"}
      />
    </>
  );
}

export default function CakeScene({ active, reducedMotion, scrollProgress, theme }: CakeSceneProps) {
  return (
    <Canvas
      camera={{ fov: 37, near: 0.1, far: 100, position: [0, 0.45, 11.2] }}
      dpr={[1, 1.5]}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      shadows="basic"
    >
      <BirthdayScene reducedMotion={reducedMotion} scrollProgress={scrollProgress} theme={theme} />
    </Canvas>
  );
}
