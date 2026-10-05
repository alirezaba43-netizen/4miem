import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize, Heart, ArrowUpRight } from "lucide-react";
import { motion, useMotionValue } from "framer-motion";
import { portfolioProjects } from "../lib/projects";
import "./gallery-layout.css";

type Lang = "fa" | "en";

const ls = {
	get(key: string): string | null { try { return window.localStorage.getItem(key); } catch { return null; } },
	set(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch { /* storage blocked */ } },
};

const copy = {
	fa: {
		hint: "برای پخش ویدیو روی دکمه‌ی پایین صفحه کلیک کنید و برای جابجایی مانیتور از فلش‌ها یا سوایپ استفاده کنید.",
		pause: "توقف ویدیو روی مانیتور",
		play: "پخش ویدیو روی مانیتور",
		prev: "ویدیوی قبلی",
		next: "ویدیوی بعدی",
		switchLang: "Switch to English",
		open: "مشاهده پروژه",
		title: "نمونه‌کارهایی برای جهان‌های تازه",
		lead: "این‌ها آزمایش‌های مستقل 4miem هستند؛ از ایده و پرامت تا تولید با هوش مصنوعی، ادیت و صداگذاری در Premiere Pro.",
		eyebrow: "گالری / نمونه‌های تجربی",
	},
	en: {
		hint: "Press the button below to play or pause the video, and use the arrows or swipe to change the screen.",
		pause: "Pause video on monitor",
		play: "Play video on monitor",
		prev: "Previous video",
		next: "Next video",
		switchLang: "تغییر به فارسی",
		open: "View project",
		title: "Sample work for new worlds",
		lead: "Independent 4miem experiments: from idea and prompts to AI generation, editing and sound design in Premiere Pro.",
		eyebrow: "GALLERY / EXPERIMENTAL SAMPLES",
	},
} as const;

// The projects now live in ../lib/projects.ts (titles, videos and the text of each project page).

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

function SingleSlide({
	project,
	lang,
	index,
	total,
	isPlaying
}: {
	project: typeof portfolioProjects[0];
	lang: Lang;
	index: number;
	total: number;
	isPlaying: boolean;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isMuted, setIsMuted] = useState(true);
	
	const [liked, setLiked] = useState<boolean>(false);
	const [likeCount, setLikeCount] = useState<number>(0);

	useEffect(() => {
		const savedLikeState = ls.get(`video_liked_${index}`);
		const savedLikeCount = ls.get(`video_count_${index}`);
		
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

		ls.set(`video_liked_${index}`, JSON.stringify(newLikedState));
		ls.set(`video_count_${index}`, newCount.toString());
	};

	return (
		<div style={{
			width: "min(320px, 75vw)",
			height: "min(520px, 62vh)",
			background: "#14181a",
			borderRadius: "16px",
			padding: "10px",
			boxShadow: "0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(46, 196, 182, 0.25)",
			border: "2px solid #22282a",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			flexShrink: 0,
			userSelect: "none"
		}}>
			<div style={{
				width: "100%",
				height: "100%",
				background: "#000",
				borderRadius: "10px",
				overflow: "hidden",
				position: "relative"
			}}>
				<video
					ref={videoRef}
					aria-label={project.title[lang]}
					src={project.videoUrl}
					poster={project.posterUrl}
					playsInline
					loop
					muted
					preload="none"
					onError={(e) => { e.currentTarget.removeAttribute("src"); e.currentTarget.load(); }}
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
					top: "12px",
					right: "12px",
					background: "rgba(0,0,0,0.65)",
					color: "#2ec4b6",
					padding: "4px 8px",
					borderRadius: "6px",
					fontSize: "11px",
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
						top: "12px",
						left: "12px",
						background: "rgba(0,0,0,0.65)",
						border: `1px solid ${liked ? "#2ec4b6" : "rgba(46, 196, 182, 0.4)"}`,
						color: "#2ec4b6",
						borderRadius: "6px",
						padding: "4px 8px",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "11px",
						fontWeight: "bold",
						zIndex: 5,
						transition: "all 0.2s ease"
					}}
				>
					<Heart size={14} fill={liked ? "#2ec4b6" : "none"} />
					<span>{likeCount}</span>
				</button>

				<div style={{
					position: "absolute",
					bottom: "12px",
					left: "12px",
					right: "12px",
					display: "flex",
					justifyContent: "space-between",
					zIndex: 10
				}}>
					<button
						type="button"
						onClick={toggleMute}
						style={{
							background: "rgba(0,0,0,0.65)",
							border: "1px solid rgba(46, 196, 182, 0.4)",
							color: "#2ec4b6",
							borderRadius: "6px",
							padding: "6px 8px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center"
						}}
					>
						{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
					</button>

					<button
						type="button"
						onClick={requestFullscreen}
						style={{
							background: "rgba(0,0,0,0.65)",
							border: "1px solid rgba(46, 196, 182, 0.4)",
							color: "#2ec4b6",
							borderRadius: "6px",
							padding: "6px 8px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center"
						}}
					>
						<Maximize size={16} />
					</button>
				</div>
			</div>

			<div style={{
				width: "6px",
				height: "6px",
				borderRadius: "50%",
				background: isPlaying ? "#ffd166" : "#2ec4b6",
				boxShadow: `0 0 8px ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
				marginTop: "10px"
			}} />
		</div>
	);
}

export default function Gallery({ lang, onOpenAi, onOpenProject }: { lang: Lang; onToggleLang?: () => void; onOpenAi: () => void; onOpenProject: (slug: string) => void }) {
	const t = copy[lang];
	const [displayIndex, setDisplayIndex] = useState(1);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [itemWidth, setItemWidth] = useState(340);

	const totalProjects = portfolioProjects.length;
	
	// محاسبه داینامیکِ عرض کارت بر اساس سایز صفحه (دسکتاپ یا موبایل)
	useEffect(() => {
		const updateWidth = () => {
			const isDesktop = window.innerWidth >= 768;
			const calculatedWidth = isDesktop ? Math.min(320, window.innerWidth * 0.75) + 24 : Math.min(320, window.innerWidth * 0.75) + 20;
			setItemWidth(calculatedWidth);
		};
		updateWidth();
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);

	const extendedProjects = useMemo(() => {
		if (totalProjects === 0) return [];
		return [
			portfolioProjects[totalProjects - 1],
			...portfolioProjects,
			portfolioProjects[0]
		];
	}, [totalProjects]);

	const x = useMotionValue(-1 * itemWidth);

	useEffect(() => {
		x.set(-displayIndex * itemWidth);
	}, [itemWidth, displayIndex, x]);

	const realIndex = displayIndex === 0 
		? totalProjects - 1 
		: displayIndex === totalProjects + 1 
		? 0 
		: displayIndex - 1;

	const handleNext = () => {
		if (isTransitioning) return;
		setIsPlaying(false);
		setIsTransitioning(true);
		const nextDisplayIndex = displayIndex + 1;
		setDisplayIndex(nextDisplayIndex);
		x.set(-nextDisplayIndex * itemWidth);
	};

	const handlePrev = () => {
		if (isTransitioning) return;
		setIsPlaying(false);
		setIsTransitioning(true);
		const prevDisplayIndex = displayIndex - 1;
		setDisplayIndex(prevDisplayIndex);
		x.set(-prevDisplayIndex * itemWidth);
	};

	const handleAnimationComplete = () => {
		setIsTransitioning(false);
		if (displayIndex === totalProjects + 1) {
			setDisplayIndex(1);
			x.set(-1 * itemWidth);
		} else if (displayIndex === 0) {
			setDisplayIndex(totalProjects);
			x.set(-totalProjects * itemWidth);
		}
	};

	const handleTogglePlay = () => {
		setIsPlaying((prev) => !prev);
	};

	const handleDragEnd = (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
		const threshold = 50;
		if (info.offset.x < -threshold || info.velocity.x < -250) {
			handleNext();
		} else if (info.offset.x > threshold || info.velocity.x > 250) {
			handlePrev();
		} else {
			x.set(-displayIndex * itemWidth);
		}
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
						width: "min(340px, 80vw)",
						height: "min(550px, 68vh)"
					}}>
						{/* دکمه قبلی */}
						<button 
							type="button"
							aria-label={t.prev}
							onClick={handlePrev}
							style={{
								position: "absolute",
								left: "-50px",
								top: "50%",
								transform: "translateY(-50%)",
								background: "rgba(20, 24, 26, 0.95)",
								border: "1px solid #2ec4b6",
								color: "#2ec4b6",
								borderRadius: "50%",
								width: "42px",
								height: "42px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								zIndex: 30,
								pointerEvents: "auto",
								boxShadow: "0 6px 16px rgba(0,0,0,0.7)"
							}}
						>
							<ChevronLeft size={24} />
						</button>

						<div style={{
							width: "min(320px, 75vw)",
							height: "min(520px, 62vh)",
							overflow: "hidden",
							borderRadius: "16px",
							display: "flex",
							alignItems: "center"
						}}>
							<motion.div
								drag="x"
								dragConstraints={{
									left: -(extendedProjects.length - 1) * itemWidth,
									right: 0
								}}
								style={{
									x,
									display: "flex",
									gap: "20px",
									pointerEvents: "auto",
									cursor: "grab",
									touchAction: "pan-y"
								}}
								whileTap={{ cursor: "grabbing" }}
								onDragEnd={handleDragEnd}
								animate={{ x: -displayIndex * itemWidth }}
								transition={{ type: "spring", stiffness: 300, damping: 28 }}
								onAnimationComplete={handleAnimationComplete}
							>
								{extendedProjects.map((project, idx) => {
									const calculatedRealIndex = idx === 0 
										? totalProjects - 1 
										: idx === extendedProjects.length - 1 
										? 0 
										: idx - 1;

									return (
										<SingleSlide
											key={`${project.id}-${idx}`}
											project={project}
											lang={lang}
											index={calculatedRealIndex}
											total={totalProjects}
											isPlaying={isPlaying && realIndex === calculatedRealIndex}
										/>
									);
								})}
							</motion.div>
						</div>

						{/* دکمه بعدی */}
						<button 
							type="button"
							aria-label={t.next}
							onClick={handleNext}
							style={{
								position: "absolute",
								right: "-50px",
								top: "50%",
								transform: "translateY(-50%)",
								background: "rgba(20, 24, 26, 0.95)",
								border: "1px solid #2ec4b6",
								color: "#2ec4b6",
								borderRadius: "50%",
								width: "42px",
								height: "42px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								zIndex: 30,
								pointerEvents: "auto",
								boxShadow: "0 6px 16px rgba(0,0,0,0.7)"
							}}
						>
							<ChevronRight size={24} />
						</button>
					</div>
				</div>

				<div className="gallery-actions" style={{ position: "absolute", bottom: "110px", left: "50%", transform: "translateX(-50%)", zIndex: 25, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", width: "max-content", maxWidth: "92vw" }}>
					<button 
						className="gallery-action"
						type="button"
						lang={lang}
						onClick={handleTogglePlay}
						style={{
							background: isPlaying ? "rgba(255, 209, 102, 0.2)" : "rgba(46, 196, 182, 0.2)",
							border: `1px solid ${isPlaying ? "#ffd166" : "#2ec4b6"}`,
							color: "#fff",
							padding: "12px 26px",
							borderRadius: "30px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: "10px",
							backdropFilter: "blur(6px)",
							fontSize: "14px",
							fontWeight: "bold",
							boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
							transition: "all 0.3s ease"
						}}
					>
						{isPlaying ? <Pause size={18} /> : <Play size={18} />} 
						{isPlaying ? t.pause : t.play}
					</button>
					<button
						className="gallery-action"
						type="button"
						lang={lang}
						aria-label={`${t.open}: ${portfolioProjects[realIndex].title[lang]}`}
						onClick={() => onOpenProject(portfolioProjects[realIndex].slug)}
						style={{
							background: "rgba(4, 12, 13, 0.55)",
							border: "1px solid rgba(255, 255, 255, 0.35)",
							color: "#fff",
							padding: "12px 22px",
							borderRadius: "30px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							backdropFilter: "blur(6px)",
							fontSize: "14px",
							fontWeight: "bold",
							boxShadow: "0 6px 24px rgba(0,0,0,0.6)"
						}}
					>
						{t.open} <ArrowUpRight size={16} aria-hidden="true" />
					</button>
				</div>

				<div className="world-overlay" style={{ pointerEvents: "none", zIndex: 10 }}>
					<div className="world-rail left">
						<span>02 / CONTROLROOM</span>
						<span className="muted">4MIEM / AI STUDIO</span>
					</div>
					<div className="world-copy" style={{ transform: "translateX(-50%)", pointerEvents: "auto" }}>
						<span className="hero-kicker"><Sparkles size={12} /> {t.eyebrow}</span>
						<h1 lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>{t.title}</h1>
						<p lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>{t.lead}</p>
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
