import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Environment, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowDownRight, Sparkles, Volume2 } from "lucide-react";
import { useLang } from "../lib/i18n";
import { playSfx, soundEnabled } from "../lib/sound";

const BOOT_FLAG = "4miem-booted";
const bootedBefore = () => { try { return window.sessionStorage.getItem(BOOT_FLAG) === "1"; } catch { return false; } };
const markBooted = () => { try { window.sessionStorage.setItem(BOOT_FLAG, "1"); } catch { /* ignore */ } };

function Boot({ onEnter }: { onEnter: () => void }) {
  const { t } = useLang();
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState("");
  const [exiting, setExiting] = useState(false);
  const entered = useRef(false);
  const interval = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/key-click.mp3");
    audioRef.current.volume = 0.8;
  }, []);

  const playKeySound = () => playSfx(audioRef.current);

  const enterOnce = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    if (interval.current !== null) window.clearInterval(interval.current);
    timers.current.forEach(window.clearTimeout);
    onEnter();
  }, [onEnter]);

  const handleStartAudioAndTyping = () => {
    if (audioRef.current && soundEnabled()) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
      }).catch(() => {});
    }

    setStarted(true);

    const phrase = "Welcome to 4miem_";
    let index = 0;
    const typingSpeed = 240;

    interval.current = window.setInterval(() => {
      index += 1;
      setTyped(phrase.slice(0, index));
      playKeySound();

      if (index >= phrase.length) {
        if (interval.current !== null) window.clearInterval(interval.current);
        interval.current = null;
        timers.current.push(window.setTimeout(() => setExiting(true), 520));
        timers.current.push(window.setTimeout(enterOnce, 1250));
      }
    }, typingSpeed);
  };

  useEffect(() => {
    return () => {
      if (interval.current !== null) window.clearInterval(interval.current);
      timers.current.forEach(window.clearTimeout);
    };
  }, []);

  const skip = () => {
    if (interval.current !== null) window.clearInterval(interval.current);
    interval.current = null;
    setExiting(true);
    enterOnce();
  };

  return <div className={`boot-screen ${exiting ? "is-exiting" : ""}`}>
    <div className="boot-grid" />
    
    {!started ? (
      <div className="boot-copy" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        <div className="boot-meta"><span>MEMORY / 001</span><span>SECURE CHANNEL</span></div>
        <div className="boot-sub" dir="auto" style={{ fontSize: "1.2rem", color: "#4cf4e5" }}>{t.home.bootPrompt}</div>
        <button 
          onClick={handleStartAudioAndTyping}
          style={{
            background: "rgba(76, 244, 229, 0.15)",
            border: "1px solid #4cf4e5",
            color: "#4cf4e5",
            padding: "12px 28px",
            borderRadius: "30px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 0 20px rgba(76, 244, 229, 0.3)",
            transition: "all 0.3s ease"
          }}
        >
          <Volume2 size={18} /> {t.home.bootStart}
        </button>
      </div>
    ) : (
      <div className="boot-copy">
        <div className="boot-meta"><span>MEMORY / 001</span><span>SECURE CHANNEL</span></div>
        <div className="boot-line"><span>{typed}</span><span className="terminal-cursor" /></div>
        <div className="boot-sub" dir="auto">{t.home.bootSub}</div>
      </div>
    )}

    {started && <button className="skip-boot" onClick={skip}>{t.home.bootSkip} <ArrowDownRight size={15} /></button>}
  </div>;
}

function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    target.set(pointer.x * 0.12, 0.1 + pointer.y * 0.05, 6.2);
    look.set(pointer.x * 0.04, pointer.y * 0.02, 0);
    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(look);
  });
  return null;
}

function InfinityParticles({ burst, hovered }: { burst: boolean; hovered: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { camera, pointer, raycaster } = useThree();
  const burstAge = useRef(0);
  const wasBurst = useRef(false);
  const plane = useMemo(() => new THREE.Plane(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const localPointer = useMemo(() => new THREE.Vector3(), []);
  
  const particleData = useMemo(() => {
    const curvePoints = Array.from({ length: 96 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.sin(angle) * 1.38, Math.sin(angle * 2) * .67, Math.cos(angle) * .08);
    });
    const curve = new THREE.CatmullRomCurve3(curvePoints, true, "centripetal");
    const count = 6000;
    const base = new Float32Array(count * 3);
    const directions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const t = Math.random();
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const angle = Math.random() * Math.PI * 2;
      const radius = .16 * Math.sqrt(Math.random());
      const radial = Math.cos(angle) * radius;
      base[offset] = point.x - tangent.y * radial;
      base[offset + 1] = point.y + tangent.x * radial;
      base[offset + 2] = point.z + Math.sin(angle) * radius;
      
      const direction = new THREE.Vector3(
        (Math.random() - .5) * 5.0,
        (Math.random() - .5) * 5.0,
        (Math.random() - .5) * 3.0,
      ).normalize();
      
      directions[offset] = direction.x;
      directions[offset + 1] = direction.y;
      directions[offset + 2] = direction.z;
      seeds[index] = Math.random() * Math.PI * 2;
    }
    return { base, directions, seeds, samples: curve.getSpacedPoints(128) };
  }, []);
  
  const positions = useMemo(() => particleData.base.slice(), [particleData]);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    
    if (burst) {
      if (!wasBurst.current) {
        burstAge.current = 0.0001;
      }
      burstAge.current = Math.min(2.0, burstAge.current + delta);
    }
    wasBurst.current = burst;

    points.updateWorldMatrix(true, false);
    raycaster.setFromCamera(pointer, camera);
    const matrix = points.parent?.matrixWorld ?? points.matrixWorld;
    center.setFromMatrixPosition(matrix);
    normal.set(0, 0, 1).transformDirection(matrix);
    plane.setFromNormalAndCoplanarPoint(normal, center);
    const hit = raycaster.ray.intersectPlane(plane, intersection);
    let proximity = 0;
    if (hit && points.parent) {
      points.parent.worldToLocal(localPointer.copy(intersection));
      let nearest = Infinity;
      for (const sample of particleData.samples) nearest = Math.min(nearest, sample.distanceToSquared(localPointer));
      proximity = 1 - THREE.MathUtils.smoothstep(Math.sqrt(nearest), .12, 1.15);
    }

    const progress = burstAge.current > 0 ? THREE.MathUtils.clamp(burstAge.current / 2.0, 0, 1) : 0;
    const burstMultiplier = Math.pow(progress, 1.6) * 10.0; 
    
    const { base, directions, seeds } = particleData;
    
    for (let index = 0; index < seeds.length; index += 1) {
      const offset = index * 3;
      positions[offset] = base[offset] + (burstAge.current > 0 ? directions[offset] * burstMultiplier : 0);
      positions[offset + 1] = base[offset + 1] + (burstAge.current > 0 ? directions[offset + 1] * burstMultiplier : 0);
      positions[offset + 2] = base[offset + 2] + (burstAge.current > 0 ? directions[offset + 2] * burstMultiplier : 0);
    }
    
    (points.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    
    const material = points.material as THREE.PointsMaterial;
    const turquoiseColor = new THREE.Color("#4cf4e5");
    const goldColor = new THREE.Color("#ffdf73");
    const targetColor = (burst || hovered) ? goldColor : turquoiseColor;
    material.color.lerp(targetColor, delta * 4);

    material.opacity = burstAge.current > 0 ? Math.max(0, 0.9 - progress * 0.9) : (.78 + proximity * .18);
    material.size = burstAge.current > 0 ? Math.max(0.005, 0.021 * (1 - progress * 0.4)) : (.018 + proximity * .01);
  });

  return <points ref={ref}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#4cf4e5" size={.018} transparent opacity={.82} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>;
}

function ReceptionScene({ burst, onActivate }: { burst: boolean; onActivate: () => void }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  
  // ارجاع فایل‌های صوتی هاور و انفجار
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const explosionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    hoverAudioRef.current = new Audio("/hover.mp3");
    hoverAudioRef.current.volume = 0.4;

    explosionAudioRef.current = new Audio("/explosion.mp3");
    explosionAudioRef.current.volume = 0.9;
  }, []);

  // مدیریت پخش صدای هاور هنگام قرار گرفتن موس روی تندیس
  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = "pointer";
    if (!burst) playSfx(hoverAudioRef.current);
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  // مدیریت کلیک و پخش صدای انفجار ذرات
  const handleClick = (event: React.MouseEvent | any) => {
    event.stopPropagation();
    if (burst) return;
    
    playSfx(explosionAudioRef.current);
    onActivate();
  };
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    const energy = hovered ? 1.06 : .9;
    const scale = burst ? 1.12 : energy;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, Math.sin(state.clock.elapsedTime * .35) * .1, 4, delta);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, Math.sin(state.clock.elapsedTime * .25) * .04, 4, delta);
    ref.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 1 - Math.pow(.001, delta));
  });

  return <>
    <color attach="background" args={["#030608"]} />
    <ambientLight intensity={.3} color="#a4fff5" />
    <pointLight position={[0, 2.5, 2]} intensity={15} distance={9} color={hovered ? "#ffdf73" : "#4cf4e5"} />
    
    <group 
      ref={ref} 
      onClick={handleClick} 
      onPointerOver={handlePointerOver} 
      onPointerOut={handlePointerOut}
    >
      <InfinityParticles burst={burst} hovered={hovered} />
      <Text position={[0, -1.9, 0]} anchorX="center" fontSize={.08} color={hovered ? "#ffdf73" : "#4cf4e5"}  font="/fonts/SpaceGrotesk-Medium.ttf" >
        {burst ? "SIGNAL BREACH" : hovered ? "ENERGY CHARGED / TAP TO ENTER" : "MOVE CLOSER / TAP TO ENTER"}
      </Text>
    </group>

    <Environment files="/env/night.hdr" />
    <EffectComposer>
      <Bloom luminanceThreshold={.15} intensity={1.6} mipmapBlur radius={.7} />
      <Noise opacity={.02} />
      <Vignette eskil={false} offset={.15} darkness={.85} />
    </EffectComposer>
  </>;
}

export default function Home({ onOpenGallery }: { onOpenGallery: () => void }) {
  const { lang, t } = useLang();
  // The typing intro plays once per visit; coming back to Home goes straight to the reception.
  const [act, setAct] = useState<"boot" | "reception">(() => (bootedBefore() ? "reception" : "boot"));
  const [burst, setBurst] = useState(false);
  const [fadeScreen, setFadeScreen] = useState(false);
  const activated = useRef(false);
  
  const enterReception = useCallback(() => { markBooted(); setAct("reception"); }, []);
  
  const activateInfinity = useCallback(() => {
    if (activated.current) return;
    activated.current = true;
    setBurst(true);
    
    setTimeout(() => {
      setFadeScreen(true);
    }, 600);

    setTimeout(() => {
      onOpenGallery();
    }, 1400);
  }, [onOpenGallery]);

  return <main className={`site-shell three-act ${fadeScreen ? "fade-out-active" : ""}`}>
    {act === "boot" && <Boot onEnter={enterReception} />}
    <header className="topbar"><div className="brand-lockup"><span className="brand-symbol">∞</span><span className="brand-name">4miem<span className="brand-dot">.</span></span></div><div className="topbar-status"><span className="status-dot" /> <span>STUDIO / ONLINE</span></div><div className="topbar-coord">35°41' N / 51°25' E</div></header>
    <section className="world-section reception-act" style={{ opacity: fadeScreen ? 0 : 1, transition: "opacity 0.6s ease-in-out" }}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.8], fov: 48 }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.setClearColor("#030608")}>
        <CameraRig />
        {act === "reception" && <ReceptionScene burst={burst} onActivate={activateInfinity} />}
      </Canvas>
      <div className="world-overlay"><div className="world-rail left"><span>01 / RECEPTION BOOTH</span><span className="muted">4MIEM / MEM STUDIO</span></div><div className="world-copy"><span className="hero-kicker"><Sparkles size={12} /> {t.home.kicker}</span><h1>{lang === "fa" ? <>به ایده<br /><em>جان</em> بده.</> : <>Give the<br /><em>idea</em> a body.</>}</h1><p dir="auto">{t.home.hint}</p>{act === "reception" && <button type="button" className="enter-gallery" onClick={activateInfinity}>{t.home.enter} <ArrowDownRight size={14} /></button>}</div><div className="world-rail right"><span>IDEAS IN / IMAGES OUT</span><span className="muted">TEHRAN · IR</span></div><div className="world-footer"><span className="scroll-line" /> <span>{t.home.footer}</span></div></div>
    </section>
  </main>;
}
