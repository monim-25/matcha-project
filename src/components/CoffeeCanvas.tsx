"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useScroll, useSpring, useTransform, motion } from "framer-motion";

const TOTAL_FRAMES = 120;

export default function CoffeeCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [loadedFrames, setLoadedFrames] = useState(0);

    // Preload Images
    useEffect(() => {
        const urls = Array.from(
            { length: TOTAL_FRAMES },
            (_, i) => `/images/${String(i + 1).padStart(4, "0")}.jpg`
        );

        const loadImages = async () => {
            const loaded: HTMLImageElement[] = [];

            await Promise.all(
                urls.map((url, i) => {
                    return new Promise<void>((resolve, reject) => {
                        const img = new Image();
                        img.src = url;
                        img.onload = () => {
                            loaded[i] = img;
                            setLoadedFrames((prev) => prev + 1);
                            resolve();
                        };
                        img.onerror = () => reject(new Error(`Failed to load ${url}`));
                    });
                })
            );

            setImages(loaded);
        };

        loadImages();
    }, []);

    // Framer Motion Scroll Logic
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    const frameIndex = useTransform(smoothProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Opacity transforms for Scrollytelling Beats
    const opacityA = useTransform(scrollYProgress, [0, 0.15, 0.20], [1, 1, 0]);
    const yA = useTransform(scrollYProgress, [0.15, 0.20], ["0%", "-50%"]);

    const opacityB = useTransform(scrollYProgress, [0.22, 0.30, 0.40, 0.48], [0, 1, 1, 0]);
    const yB = useTransform(scrollYProgress, [0.22, 0.30, 0.40, 0.48], ["50%", "0%", "0%", "-50%"]);

    const opacityC = useTransform(scrollYProgress, [0.50, 0.58, 0.68, 0.75], [0, 1, 1, 0]);
    const yC = useTransform(scrollYProgress, [0.50, 0.58, 0.68, 0.75], ["50%", "0%", "0%", "-50%"]);

    const opacityD = useTransform(scrollYProgress, [0.80, 0.88, 1], [0, 1, 1]);
    const yD = useTransform(scrollYProgress, [0.80, 0.88, 1], ["50%", "0%", "0%"]);

    // Canvas Rendering function
    const renderCanvas = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = images[index];
        if (!img) return;

        // Fix for high DPI / Retina displays
        const { width, height } = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Resize canvas ONLY if it changed to prevent unnecessary redraws
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, width, height);

        // object-fit: contain simulation
        const scale = Math.min(width / img.width, height / img.height);
        const x = width / 2 - (img.width / 2) * scale;
        const y = height / 2 - (img.height / 2) * scale;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    // Render when index changes
    useEffect(() => {
        if (images.length === TOTAL_FRAMES) {
            const unsubscribe = frameIndex.on("change", (latest) => {
                requestAnimationFrame(() => {
                    renderCanvas(Math.floor(latest));
                });
            });
            renderCanvas(0);

            const resizeHandler = () => renderCanvas(Math.floor(frameIndex.get()));
            window.addEventListener("resize", resizeHandler);

            return () => {
                unsubscribe();
                window.removeEventListener("resize", resizeHandler);
            };
        }
    }, [images, frameIndex]);

    const progressPercentage = useMemo(() => {
        return Math.floor((loadedFrames / TOTAL_FRAMES) * 100);
    }, [loadedFrames]);

    const isLoaded = loadedFrames === TOTAL_FRAMES;

    return (
        <>
            {/* Loading Screen */}
            {!isLoaded && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-coffee-base px-4">
                    <div className="h-0.5 w-full max-w-sm rounded-full bg-white/10 overflow-hidden mb-8">
                        <div
                            className="h-full bg-coffee-accent transition-all duration-300 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <h1 className="font-serif text-3xl md:text-5xl text-white mb-4 tracking-wide">Aroma Essence</h1>
                    <span className="font-sans text-xs tracking-[0.2em] text-coffee-accent uppercase">
                        Preparing Experience {progressPercentage}%
                    </span>
                </div>
            )}

            {/* Main Container handling the scroll height */}
            <div ref={containerRef} className="relative h-[800vh] bg-coffee-base">
                {/* Sticky Canvas pinning to the screen visually */}
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 h-full w-full object-cover z-0"
                    />

                    {/* Fading Gradient Overlays to frame the bean nicely avoiding hard edges */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-coffee-base to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-coffee-base to-transparent z-10 pointer-events-none" />

                    {/* Scrollytelling Beat Overlays */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6 text-center">

                        {/* Beat A: The Origin */}
                        <motion.div
                            style={{ opacity: opacityA, y: yA }}
                            className="absolute mb-48 md:mb-64"
                        >
                            <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl mb-4">
                                BORN IN THE SHADE.
                            </h2>
                            <p className="font-sans text-lg md:text-xl text-white/80 max-w-xl mx-auto font-light tracking-wide">
                                Hand-picked Arabica beans from the highlands.
                            </p>
                        </motion.div>

                        {/* Beat B: The Roast */}
                        <motion.div
                            style={{ opacity: opacityB, y: yB }}
                            className="absolute mt-48 md:mt-64"
                        >
                            <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl mb-4 text-coffee-accent">
                                THE PERFECT CRACK.
                            </h2>
                            <p className="font-sans text-lg md:text-xl text-white/80 max-w-xl mx-auto font-light tracking-wide">
                                Roasted at precise temperatures to unlock 800+ aromatic compounds.
                            </p>
                        </motion.div>

                        {/* Beat C: The Extraction */}
                        <motion.div
                            style={{ opacity: opacityC, y: yC }}
                            className="absolute mb-64 md:mb-80"
                        >
                            <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl mb-4">
                                LIQUID GOLD.
                            </h2>
                            <p className="font-sans text-lg md:text-xl text-white/80 max-w-xl mx-auto font-light tracking-wide">
                                9 bars of pressure. 25 seconds of magic.
                            </p>
                        </motion.div>

                        {/* Beat D: The Ritual */}
                        <motion.div
                            style={{ opacity: opacityD, y: yD }}
                            className="absolute flex flex-col items-center mt-32 md:mt-48 pointer-events-auto"
                        >
                            <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl mb-4">
                                AWAKEN YOUR SENSES.
                            </h2>
                            <p className="font-sans text-lg md:text-xl text-white/80 max-w-xl mx-auto font-light tracking-wide mb-10">
                                Experience the perfect brew at home.
                            </p>
                            <button className="group relative px-8 py-4 bg-coffee-accent text-coffee-base font-sans font-medium hover:bg-white transition-colors duration-300 tracking-wide uppercase text-sm rounded-none overflow-hidden hover:shadow-[0_0_20px_rgba(212,163,115,0.4)]">
                                <span className="relative z-10">Order Your Sample Pack</span>
                                <div className="absolute inset-0 bg-white transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>
                            </button>
                        </motion.div>

                    </div>
                </div>
            </div>
        </>
    );
}
