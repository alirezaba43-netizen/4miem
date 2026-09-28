import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Environment, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "fa" | "en";

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
		target.set(pointer.x * .35, .25 + pointer.y * .12, 7.2);
		look.set(pointer.x * .12, .08 + pointer.y * .06, 0);
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
			position={[1.8, -1.8, 0.6]} 
			rotation={[-Math.PI / 3.2, 0, -0.15]}
			onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
			onPointerLeave={() => { setHovered(false); document.body.style.cursor = ""; }}
			onPointerDown={(e) => { 
				e.stopPropagation(); 
				onOpenAi(); 
			}}
		>
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[1.1, 0.75, 0.03]} />
				<meshStandardMaterial color="#1a1e21" metalness={0.9} roughness={0.2} />
			</mesh>
			<mesh position={[0, 0, 0.016]}>
				<planeGeometry args={[1.02, 0.67]} />
				<meshStandardMaterial 
					ref={screenRef}
					color="#03070b" 
					emissive="#0d232c" 
					emissiveIntensity={0.3} 
					roughness={0.1}
				/>
			</mesh>
			<mesh position={[0, 0, 0.018]}>
				<planeGeometry args={[0.55, 0.55]} />
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
			<fog attach="fog" args={["#030507", 7, 18]} />
			
			<ambientLight intensity={.5} color="#cce6ff" />
			<pointLight position={[0, 4.2, 2.5]} intensity={40} distance={13} color="#ffe5b4" />
			<pointLight position={[-4, 2.5, -1]} intensity={22} distance={10} color="#2ec4b6" />
			<pointLight position={[4, 1.5, 1]} intensity={16} distance={8} color="#ffd32a" />

			<mesh position={[0, -2.15, -0.4]}>
				<boxGeometry args={[9.5, .08, 4.2]} />
				<meshStandardMaterial color="#0a0e12" metalness={0.85} roughness={.12} />
			</mesh>

			{[-4.3, 4.3].map((x) => [-1.5, 1.2].map((z) => (
				<mesh key={`${x}-${z}`} position={[x, -2.85, z]}>
					<boxGeometry args={[.12, 1.3, .12]} />
					<meshStandardMaterial color="#1c2327" metalness={0.88} roughness={0.25} />
				</mesh>
			)))}

			<InteractiveTablet onOpenAi={onOpenAi} />

			<Environment preset="night" />
			
			<EffectComposer>
				<Bloom luminanceThreshold={.12} intensity={1.5} mipmapBlur radius={.75} />
				<Noise opacity={.02} />
				<Vignette eskil={false} offset={.18} darkness={.82} />
			</EffectComposer>
		</>
	);
}

export default function Gallery({ lang, onToggleLang, onOpenAi }: { lang: Lang; onToggleLang: () => void; onOpenAi: () => void }) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [isPlaying, setIsPlaying] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

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
		const video = videoRef.current;
		if (!video) return;

		if (video.paused) {
			video.play().then(() => setIsPlaying(true)).catch(() => {});
		} else {
			video.pause();
			setIsPlaying(false);
		}
	};

	// تنظیمات انیمیشن سه‌بعدی (زاویه چرخش به عقب + اسلاید)
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
			<header className="topbar">
				<div className="brand-lockup">
					<span className="brand-symbol">∞</span>
					<span className="brand-name">4miem<span className="brand-dot">.</span></span>
				</div>
				<div className="topbar-status">
					<span className="status-dot" /> <span>CONTROL ROOM / 2026</span>
				</div>
				<button className="gallery-language" onClick={onToggleLang}>{lang === "fa" ? "EN" : "FA"}</button>
			</header>
			
			<section className="world-section gallery-act" style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
				<Canvas 
					dpr={[1, 2]} 
					camera={{ position: [0, .8, 7.8], fov: 42 }} 
					gl={{ antialias: true, powerPreference: "high-performance" }} 
					onCreated={({ gl }) => gl.setClearColor("#030507")}
					style={{ position: "absolute", inset: 0 }}
				>
					<GalleryCamera />
					<DeskScene onOpenAi={onOpenAi} />
				</Canvas>

				{/* کانتینر مرکزی با پرسپکتیو سه‌بعدی */}
				<div 
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						pointerEvents: "none",
						zIndex: 10,
						overflow: "hidden",
						perspective: "1000px"
					}}
				>
					<AnimatePresence initial={false} custom={direction} mode="popLayout">
						<motion.div 
							key={currentIndex}
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
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
							style={{
								position: "absolute",
								width: "240px",
								height: "380px",
								background: "#14181a",
								borderRadius: "12px",
								padding: "8px",
								boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(46, 196, 182, 0.2)",
								border: "2px solid #22282a",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								pointerEvents: "auto",
								touchAction: "pan-y",
								transformStyle: "preserve-3d"
							}}
						>
							{/* فلش چپ */}
							<button 
								onClick={handlePrev}
								style={{
									position: "absolute",
									left: "-55px",
									top: "50%",
									transform: "translateY(-50%)",
									background: "rgba(20, 24, 26, 0.9)",
									border: "1px solid #2ec4b6",
									color: "#2ec4b6",
									borderRadius: "50%",
									width: "40px",
									height: "40px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									zIndex: 20,
									boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
								}}
							>
								<ChevronLeft size={22} />
							</button>

							{/* فلش راست */}
							<button 
								onClick={handleNext}
								style={{
									position: "absolute",
									right: "-55px",
									top: "50%",
									transform: "translateY(-50%)",
									background: "rgba(20, 24, 26, 0.9)",
									border: "1px solid #2ec4b6",
									color: "#2ec4b6",
									borderRadius: "50%",
									width: "40px",
									height: "40px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									zIndex: 20,
									boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
								}}
							>
								<ChevronRight size={22} />
							</button>

							{/* ویدیو و قاب */}
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
									src={portfolioProjects[currentIndex].videoUrl}
									playsInline
									loop
									style={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
										display: "block"
									}}
									onPlay={() => setIsPlaying(true)}
									onPause={() => setIsPlaying(false)}
								/>

								{/* شمارنده */}
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
									0{currentIndex + 1} / 0{portfolioProjects.length}
								</div>
							</div>

							{/* چراغ LED */}
							<div style={{
								width: "6px",
								height: "6px",
								borderRadius: "50%",
								background: isPlaying ? "#ffd166" : "#2ec4b6",
								boxShadow: `0 0 8px ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
								marginTop: "8px"
							}} />
						</motion.div>
					</AnimatePresence>
				</div>

				{/* دکمه کنترل پخش */}
				<div style={{ position: "absolute", bottom: "75px", left: "50%", transform: "translateX(-50%)", zIndex: 15 }}>
					<button 
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
						{isPlaying ? "توقف ویدیو روی مانیتور" : "پخش ویدیو روی مانیتور"}
					</button>
				</div>

				<div className="world-overlay">
					<div className="world-rail left">
						<span>02 / CONTROL ROOM</span>
						<span className="muted">4MIEM / AI STUDIO</span>
					</div>
					<div className="world-copy">
						<span className="hero-kicker"><Sparkles size={12} /> ADVANCED WORKSPACE</span>
						<h1>A desk for<br /><em>new worlds.</em></h1>
						<p>برای پخش ویدیو روی دکمه‌ی پایین صفحه کلیک کنید و برای جابجایی مانیتور از فلش‌ها یا سوایپ استفاده کنید.</p>
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