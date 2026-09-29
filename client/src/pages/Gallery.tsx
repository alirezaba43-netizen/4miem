import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize, Heart } from "lucide-react";
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
  { id: 1, title: "Project One", videoUrl: "/portfolio.mp4", posterUrl: "/portfolio-poster-1.jpg" },
  { id: 2, title: "Project Two", videoUrl: "/portfolio-2.mp4", posterUrl: "/portfolio-poster-2.jpg" },
  { id: 3, title: "Project Three", videoUrl: "/portfolio-3.mp4", posterUrl: "/portfolio-poster-3.jpg" },
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

function VideoSlide({
	project,
	index,
	total,
	isPlaying,
	onNext,
	onPrev
}: {
	project: typeof portfolioProjects[0];
	index: number;
	total: number;
	isPlaying: boolean;
	onNext: () => void;
	onPrev: () => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isMuted, setIsMuted] = useState(true);
	
	const [liked, setLiked] = useState<boolean>(false);
	const [likeCount, setLikeCount] = useState<number>(0);

	useEffect(() => {
		const savedLikeState = localStorage.getItem(`video_liked_${index}`);
		const savedLikeCount = localStorage.getItem(`video_count_${index}`);
		
		if (savedLikeState !== null) {
			setLiked(JSON.parse(savedLikeState));
		} else {
			setLiked(false);
		}

		if (savedLikeCount !== null) {
			setLikeCount(Number(savedLikeCount));
		} else {
			setLikeCount(0);
		}
	}, [index]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.play().catch(() => {});
		} else {
			video.pause();
		}
	}, [isPlaying]);

	const toggleMute = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (videoRef.current) {
			videoRef.current.muted = !videoRef.current.muted;
			setIsMuted(videoRef.current.muted);
		}
	};

	const requestFullscreen = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (videoRef.current) {
			if (videoRef.current.requestFullscreen) {
				videoRef.current.requestFullscreen();
			} else if ((videoRef.current as any).webkitRequestFullscreen) {
				(videoRef.current as any).webkitRequestFullscreen();
			}
		}
	};

	const handleLikeToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		const newLikedState = !liked;
		const newCount = newLikedState ? likeCount + 1 : likeCount - 1;
		
		setLiked(newLikedState);
		setLikeCount(newCount);

		localStorage.setItem(`video_liked_${index}`, JSON.stringify(newLikedState));
		localStorage.setItem(`video_count_${index}`, newCount.toString());
	};

	// قانون دقیق برای کشیدن (Drag): فقط اگر از حد مشخصی گذشت اسلاید عوض شود، وگرنه برگردد سر جایش
	const handleDragEnd = (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
		const swipeThreshold = 90; // مقدار جابجایی لازم برای عوض شدن اسلاید
		if (info.offset.x > swipeThreshold || info.velocity.x > 400) {
			onPrev();
		} else if (info.offset.x < -swipeThreshold || info.velocity.x < -400) {
			onNext();
		}
	};

	return (
		<motion.div 
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
			drag="x"
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={0.8}
			onDragEnd={handleDragEnd}
			style={{
				width: "205px",
				height: "330px",
				background: "#14181a",
				borderRadius: "12px",
				padding: "7px",
				boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(46, 196, 182, 0.2)",
				border: "2px solid #22282a",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				pointerEvents: "auto",
				touchAction: "none",
				cursor: "grab",
				flexShrink: 0
			}}
			whileTap={{ cursor: "grabbing" }}
		>
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
					poster={project.posterUrl}
					playsInline
					loop
					muted
					preload="none"
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						display: "block",
						pointerEvents: "none"
					}}
				/>

				<div style={{
					position: "absolute",
					top: "8px",
					right: "8px",
					background: "rgba(0,0,0,0.6)",
					color: "#2ec4b6",
					padding: "2px 6px",
					borderRadius: "4px",
					fontSize: "9px",
					fontWeight: "bold",
					zIndex: 5
				}}>
					0{index + 1} / 0{total}
				</div>

				<button
					type="button"
					onClick={handleLikeToggle}
					style={{
						position: "absolute",
						top: "8px",
						left: "8px",
						background: "rgba(0,0,0,0.6)",
						border: `1px solid ${liked ? "#2ec4b6" : "rgba(46, 196, 182, 0.4)"}`,
						color: "#2ec4b6",
						borderRadius: "4px",
						padding: "2px 5px",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "3px",
						fontSize: "9px",
						fontWeight: "bold",
						zIndex: 5,
						transition: "all 0.2s ease"
					}}
				>
					<Heart size={12} fill={liked ? "#2ec4b6" : "none"} />
					<span>{likeCount}</span>
				</button>

				<div style={{
					position: "absolute",
					bottom: "8px",
					left: "8px",
					right: "8px",
					display: "flex",
					justifyContent: "space-between",
					zIndex: 10
				}}>
					<button
						type="button"
						onClick={toggleMute}
						style={{
							background: "rgba(0,0,0,0.6)",
							border: "1px solid rgba(46, 196, 182, 0.4)",
							color: "#2ec4b6",
							borderRadius: "4px",
							padding: "3px 5px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center"
						}}
					>
						{isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
					</button>

					<button
						type="button"
						onClick={requestFullscreen}
						style={{
							background: "rgba(0,0,0,0.6)",
							border: "1px solid rgba(46, 196, 182, 0.4)",
							color: "#2ec4b6",
							borderRadius: "4px",
							padding: "3px 5px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center"
						}}
					>
						<Maximize size={13} />
					</button>
				</div>
			</div>

			<div style={{
				width: "5px",
				height: "5px",
				borderRadius: "50%",
				background: isPlaying ? "#ffd166" : "#2ec4b6",
				boxShadow: `0 0 6px ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
				marginTop: "6px"
			}} />
		</motion.div>
	);
}

export default function Gallery({ lang, onToggleLang, onOpenAi }: { lang: Lang; onToggleLang: () => void; onOpenAi: () => void }) {
	const t = copy[lang];
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);

	const handleNext = () => {
		setIsPlaying(false);
		setCurrentIndex((prev) => (prev === portfolioProjects.length - 1 ? 0 : prev + 1));
	};

	const handlePrev = () => {
		setIsPlaying(false);
		setCurrentIndex((prev) => (prev === 0 ? portfolioProjects.length - 1 : prev - 1));
	};

	const handleTogglePlay = () => {
		setIsPlaying((prev) => !prev);
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
						pointerEvents: "none"
					}}
				>
					<div style={{
						position: "relative",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "240px",
						height: "350px"
					}}>
						<button 
							type="button"
							aria-label={t.prev}
							onClick={handlePrev}
							style={{
								position: "absolute",
								left: "-42px",
								top: "50%",
								transform: "translateY(-50%)",
								background: "rgba(20, 24, 26, 0.95)",
								border: "1px solid #2ec4b6",
								color: "#2ec4b6",
								borderRadius: "50%",
								width: "35px",
								height: "35px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								zIndex: 30,
								pointerEvents: "auto",
								boxShadow: "0 4px 12px rgba(0,0,0,0.6)"
							}}
						>
							<ChevronLeft size={20} />
						</button>

						<AnimatePresence mode="wait">
							<VideoSlide
								key={currentIndex}
								project={portfolioProjects[currentIndex]}
								index={currentIndex}
								total={portfolioProjects.length}
								isPlaying={isPlaying}
								onNext={handleNext}
								onPrev={handlePrev}
							/>
						</AnimatePresence>

						<button 
							type="button"
							aria-label={t.next}
							onClick={handleNext}
							style={{
								position: "absolute",
								right: "-42px",
								top: "50%",
								transform: "translateY(-50%)",
								background: "rgba(20, 24, 26, 0.95)",
								border: "1px solid #2ec4b6",
								color: "#2ec4b6",
								borderRadius: "50%",
								width: "35px",
								height: "35px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								zIndex: 30,
								pointerEvents: "auto",
								boxShadow: "0 4px 12px rgba(0,0,0,0.6)"
							}}
						>
							<ChevronRight size={20} />
						</button>
					</div>
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
				
