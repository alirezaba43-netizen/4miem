import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "fa" | "en";

const copy = {
	fa: {
		hint: "برای پخش ویدیو روی دکمه‌ی پایین صفحه کلیک کنید و برای جابجایی مانیتور از فلش‌ها یا سوایپ استفاده کنید.",
		pause: "توقف ویدیو روی مانیتور",
		play: "پخش ویدیو روی مانیتور",
		prev: "ویدیوی قبلی",
		next: "ویدیوی بعدی",
		switchLang: "Switch to English",
	},
	en: {
		hint: "Press the button below to play or pause the video, and use the arrows or swipe to change the screen.",
		pause: "Pause video on monitor",
		play: "Play video on monitor",
		prev: "Previous video",
		next: "Next video",
		switchLang: "تغییر به فارسی",
	},
} as const;

const portfolioProjects = [
  { id: 1, title: "Project One", videoUrl: "/portfolio.mp4" },
  { id: 2, title: "Project Two", videoUrl: "/portfolio-2.mp4" },
  { id: 3, title: "Project Three", videoUrl: "/portfolio-3.mp4" },
];

function GalleryCamera() {
	const { camera, pointer } = useThree();
	const target = useMemo(() => new THREE.Vector3(), []);
	const look = useMemo(() => new THREE.Vector3(), []);
	useFrame((_, delta) => {
		target.set(pointer.x * .25, .2 + pointer.y * .1, 7.5);
		look.set(pointer.x * .1, .05 + pointer.y * .05, 0);
		camera.position.lerp(target, 1 - Math.pow(.001, delta));
		camera.lookAt(look);
	});
	return null;
}

function InteractiveTablet({ onOpenAi }: { onOpenAi: () => void }) {
	const [hovered, setHovered] = useState(false);
	const screenRef = useRef<THREE.MeshStandardMaterial>(null);
	const logoMaterial = useRef<THREE.MeshBasicMaterial>(null);
	const logoTexture = useTexture("/miem_logo.png");

	useEffect(() => {
		logoTexture.colorSpace = THREE.SRGBColorSpace;
		logoTexture.needsUpdate = true;
	}, [logoTexture]);

	useFrame((_, delta) => {
		if (screenRef.current) {
			const targetEmissive = hovered ? 0.8 : 0.3;
			screenRef.current.emissiveIntensity = THREE.MathUtils.damp(screenRef.current.emissiveIntensity, targetEmissive, 6, delta);
		}
		if (logoMaterial.current) {
			logoMaterial.current.opacity = THREE.MathUtils.damp(logoMaterial.current.opacity, hovered ? 0.9 : 0.7, 6, delta);
		}
	});

	return (
		<group 
			position={[2.2, -1.2, 0.4]} 
			rotation={[-Math.PI / 3.2, 0, -0.15]}
			onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
			onPointerLeave={() => { setHovered(false); document.body.style.cursor = ""; }}
			onClick={(e) => { e.stopPropagation(); onOpenAi(); }}
		>
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[1.0, 0.68, 0.025]} />
				<meshStandardMaterial color="#1a1e21" metalness={0.9} roughness={0.2} />
			</mesh>
			<mesh position={[0, 0, 0.014]}>
				<planeGeometry args={[0.94, 0.62]} />
				<meshStandardMaterial 
					ref={screenRef}
					color="#03070b" 
					emissive="#0d232c" 
					emissiveIntensity={0.3} 
					roughness={0.1}
				/>
			</mesh>
			<mesh position={[0, 0, 0.016]}>
				<planeGeometry args={[0.45, 0.45]} />
				<meshBasicMaterial 
					ref={logoMaterial} 
					map={logoTexture} 
					color="#2ec4b6" 
					transparent 
					opacity={0.7} 
					blending={THREE.AdditiveBlending} 
					toneMapped={false} 
					depthWrite={false} 
				/>
			</mesh>
		</group>
	);
}

function DeskScene({ onOpenAi }: { onOpenAi: () => void }) {
	return (
		<>
			<color attach="background" args={["#030507"]} />
			<fog attach="fog" args={["#030507", 6, 20]} />
			
			<ambientLight intensity={1.2} color="#ffffff" />
			<directionalLight position={[0, 5, 3]} intensity={2.5} color="#cce6ff" />
			<pointLight position={[0, 3, 2]} intensity={30} color="#ffe5b4" />

			<mesh position={[0, -1.5, -0.5]}>
				<boxGeometry args={[10, 0.15, 5]} />
				<meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
			</mesh>

			<InteractiveTablet onOpenAi={onOpenAi} />

			<EffectComposer>
				<Bloom luminanceThreshold={0.2} intensity={1.0} />
				<Noise opacity={.02} />
				<Vignette eskil={false} offset={.18} darkness={.82} />
			</EffectComposer>
		</>
	);
}

// کامپوننت مستقل برای هر اسلاید ویدیو به همراه رفرنس ایزوله
function VideoSlide({
	project,
	index,
	total,
	isPlaying,
	direction,
	onPrev,
	onNext,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	slideVariants,
	t
}: {
	project: typeof portfolioProjects[0];
	index: number;
	total: number;
	isPlaying: boolean;
	direction: number;
	onPrev: () => void;
	onNext: () => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchMove: (e: React.TouchEvent) => void;
	onTouchEnd: () => void;
	slideVariants: any;
	t: typeof copy["fa"];
}) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.play().catch(() => {});
		} else {
			video.pause();
		}
	}, [isPlaying]);

	return (
		<motion.div 
			custom={direction}
			variants={slideVariants}
			initial="enter"
			animate="center"
			exit="exit"
			transition={{
				x: { type: "spring", stiffness: 280, damping: 25 },
				rotateY: { type: "spring", stiffness: 280, damping: 25 },
				opacity: { duration: 0.25 },
				scale: { duration: 0.25 }
			}}
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			style={{
				position: "absolute",
				width: "220px",
				height: "350px",
				background: "#14181a",
				borderRadius: "12px",
				padding: "8px",
				boxShadow: "0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(46, 196, 182, 0.25)",
				border: "2px solid #22282a",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				pointerEvents: "auto",
				touchAction: "pan-y",
				transformStyle: "preserve-3d"
			}}
		>
			<button 
				type="button"
				aria-label={t.prev}
				onClick={onPrev}
				style={{
					position: "absolute",
					left: "-55px",
					top: "50%",
					transform: "translateY(-50%)",
					background: "rgba(20, 24, 26, 0.95)",
					border: "1px solid #2ec4b6",
					color: "#2ec4b6",
					borderRadius: "50%",
					width: "40px",
					height: "40px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					zIndex: 30,
					boxShadow: "0 4px 15px rgba(0,0,0,0.7)"
				}}
			>
				<ChevronLeft size={22} />
			</button>

			<button 
				type="button"
				aria-label={t.next}
				onClick={onNext}
				style={{
					position: "absolute",
					right: "-55px",
					top: "50%",
					transform: "translateY(-50%)",
					background: "rgba(20, 24, 26, 0.95)",
					border: "1px solid #2ec4b6",
					color: "#2ec4b6",
					borderRadius: "50%",
					width: "40px",
					height: "40px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					zIndex: 30,
					boxShadow: "0 4px 15px rgba(0,0,0,0.7)"
				}}
			>
				<ChevronRight size={22} />
			</button>

			<div style={{
				width: "100%",
				height: "100%",
				background: "#000",
				borderRadius: "6px",
				overflow: "hidden",
				position: "relative"
			}}>
				<video
					ref={videoRef}
					aria-label={project.title}
					src={project.videoUrl}
					playsInline
					loop
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						display: "block"
					}}
				/>

				<div style={{
					position: "absolute",
					top: "10px",
					right: "10px",
					background: "rgba(0,0,0,0.6)",
					color: "#2ec4b6",
					padding: "2px 8px",
					borderRadius: "4px",
					fontSize: "10px",
					fontWeight: "bold",
					zIndex: 5
				}}>
					0{index + 1} / 0{total}
				</div>
			</div>

			<div style={{
				width: "6px",
				height: "6px",
				borderRadius: "50%",
				background: isPlaying ? "#ffd166" : "#2ec4b6",
				boxShadow: `0 0 8px ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
				marginTop: "8px"
			}} />
		</motion.div>
	);
}

export default function Gallery({ lang, onToggleLang, onOpenAi }: { lang: Lang; onToggleLang: () => void; onOpenAi: () => void }) {
	const t = copy[lang];
	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [isPlaying, setIsPlaying] = useState(false);

	const touchStartX = useRef(0);
	const touchEndX = useRef(0);

	const handleNext = () => {
		setDirection(1);
		setIsPlaying(false);
		setCurrentIndex((prev) => (prev === portfolioProjects.length - 1 ? 0 : prev + 1));
	};

	const handlePrev = () => {
		setDirection(-1);
		setIsPlaying(false);
		setCurrentIndex((prev) => (prev === 0 ? portfolioProjects.length - 1 : prev - 1));
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		touchEndX.current = e.touches[0].clientX;
	};

	const handleTouchEnd = () => {
		if (!touchStartX.current || !touchEndX.current) return;
		const distance = touchStartX.current - touchEndX.current;
		if (distance > 50) handleNext();
		else if (distance < -50) handlePrev();
		touchStartX.current = 0;
		touchEndX.current = 0;
	};

	const handleTogglePlay = () => {
		setIsPlaying((prev) => !prev);
	};

	const slideVariants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 150 : -150,
			rotateY: direction > 0 ? 45 : -45,
			opacity: 0,
			scale: 0.85
		}),
		center: {
			zIndex: 1,
			x: 0,
			rotateY: 0,
			opacity: 1,
			scale: 1
		},
		exit: (direction: number) => ({
			zIndex: 0,
			x: direction < 0 ? 150 : -150,
			rotateY: direction < 0 ? 45 : -45,
			opacity: 0,
			scale: 0.85
		})
	};

	return (
		<main className={`site-shell three-act lang-${lang} gallery-page`}>
			<header className="topbar" style={{ zIndex: 50 }}>
				<div className="brand-lockup">
					<span className="brand-symbol">∞</span>
					<span className="brand-name">4miem<span className="brand-dot">.</span></span>
				</div>
				<div className="topbar-status">
					<span className="status-dot" /> <span>CONTROL ROOM / 2026</span>
				</div>
				<button type="button" className="gallery-language" aria-label={t.switchLang} onClick={onToggleLang}>{lang === "fa" ? "EN" : "FA"}</button>
			</header>
			
			<section className="world-section gallery-act" style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden" }}>
				<Canvas 
					aria-hidden="true"
					dpr={[1, 1.5]} 
					camera={{ position: [0, .6, 7.5], fov: 42 }} 
					gl={{ antialias: true, powerPreference: "high-performance" }} 
					onCreated={({ gl }) => gl.setClearColor("#030507")}
					style={{ position: "absolute", inset: 0, zIndex: 1 }}
				>
					<GalleryCamera />
					<DeskScene onOpenAi={onOpenAi} />
				</Canvas>

				<div 
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 20,
						pointerEvents: "none",
						perspective: "1000px"
					}}
				>
					<AnimatePresence initial={false} custom={direction} mode="popLayout">
						<VideoSlide
							key={currentIndex}
							project={portfolioProjects[currentIndex]}
							index={currentIndex}
							total={portfolioProjects.length}
							isPlaying={isPlaying}
							direction={direction}
							onPrev={handlePrev}
							onNext={handleNext}
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
							slideVariants={slideVariants}
							t={t}
						/>
					</AnimatePresence>
				</div>

				<div style={{ position: "absolute", bottom: "130px", left: "50%", transform: "translateX(-50%)", zIndex: 25 }}>
					<button 
						type="button"
						lang={lang}
						onClick={handleTogglePlay}
						style={{
							background: isPlaying ? "rgba(255, 209, 102, 0.2)" : "rgba(46, 196, 182, 0.2)",
							border: `1px solid ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
							color: "#fff",
							padding: "10px 22px",
							borderRadius: "25px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							backdropFilter: "blur(6px)",
							fontSize: "13px",
							fontWeight: "bold",
							boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
							transition: "all 0.3s ease"
						}}
					>
						{isPlaying ? <Pause size={16} /> : <Play size={16} />} 
						{isPlaying ? t.pause : t.play}
					</button>
				</div>

				<div className="world-overlay" style={{ pointerEvents: "none", zIndex: 10 }}>
					<div className="world-rail left">
						<span>02 / CONTROL ROOM</span>
						<span className="muted">4MIEM / AI STUDIO</span>
					</div>
					<div className="world-copy" style={{ transform: "translate(-50%, -50px)", pointerEvents: "auto" }}>
						<span className="hero-kicker"><Sparkles size={12} /> ADVANCED WORKSPACE</span>
						<h1>A desk for<br /><em>new worlds.</em></h1>
						<p lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>{t.hint}</p>
					</div>
					<div className="world-rail right">
						<span>IDEAS IN / IMAGES OUT</span>
						<span className="muted">TEHRAN · IR</span>
					</div>
				</div>
			</section>
		</main>
	);
}
