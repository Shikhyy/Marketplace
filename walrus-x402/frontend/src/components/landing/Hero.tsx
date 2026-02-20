'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ArrowRight, Play, Zap, Volume2, Maximize } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
    const { login, authenticated } = usePrivy();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    const y = useTransform(scrollY, [0, 500], [0, 200]);
    const rotateOrbits = useTransform(scrollY, [0, 500], [0, 20]);
    const opacityOrbits = useTransform(scrollY, [0, 300], [0.3, 0.1]);

    return (
        <section ref={containerRef} className="relative min-h-[120vh] flex flex-col items-center pt-24 pb-20 px-4 overflow-visible">

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Massive Star Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-[100vw] bg-[radial-gradient(circle_at_50%_0%,rgba(100,50,255,0.15),transparent_60%)] blur-[100px]" />

                {/* The "Arc" - Using a massive circle with border */}
                <motion.div style={{ rotate: rotateOrbits, opacity: opacityOrbits } as any} className="absolute top-[25vh] left-1/2 -translate-x-1/2 w-[180vw] aspect-square rounded-full border-[1px] border-white/10 mask-linear-fade" />
                <motion.div style={{ rotate: rotateOrbits, opacity: opacityOrbits } as any} className="absolute top-[35vh] left-1/2 -translate-x-1/2 w-[160vw] aspect-square rounded-full border-[1px] border-indigo-500/20 shadow-[0_0_100px_rgba(99,102,241,0.2)]" />

                {/* Stars - Simple CSS dots for now */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-7xl mx-auto space-y-10">

                {/* Pill Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
                >
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-xs font-medium text-cyan-200 tracking-wide uppercase">Live on Base Sepolia</span>
                </motion.div>

                {/* Main Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="text-6xl md:text-9xl font-serif font-medium tracking-tight text-white leading-[0.9] drop-shadow-2xl"
                >
                    Stream. Read. <br />
                    <span className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent italic pr-2">Own Forever.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    The first decentralized content marketplace where you keep <span className="text-white font-medium">100%</span> of revenue. No middlemen. No censorship. Just you and your audience.
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center gap-4 pt-4"
                >
                    {authenticated ? (
                        <Link
                            href="/explore"
                            className="group h-12 px-8 rounded-full bg-white text-slate-950 font-semibold text-lg hover:bg-slate-200 transition-all flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105"
                        >
                            Start Exploring <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <button
                            onClick={login}
                            className="group h-12 px-8 rounded-full bg-white text-slate-950 font-semibold text-lg hover:bg-slate-200 transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                        >
                            Start Journey <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    <Link
                        href="/creators"
                        className="h-12 px-8 rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition-all flex items-center gap-2 hover:border-white/20"
                    >
                        <Play className="w-4 h-4 fill-current" /> Watch Demo
                    </Link>
                </motion.div>
            </div>

            {/* 3D Visual - The "Space Station" Dashboard */}
            <motion.div
                style={{ y, rotateX: useTransform(scrollY, [0, 400], [30, 0]) }}
                className="relative w-full max-w-6xl mt-8 perspective-[2000px] z-20 px-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotateX: 25 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 10 }}
                    transition={{ duration: 1.2, delay: 0.4, ease: "circOut" }}
                    className="relative rounded-[2rem] bg-slate-900/80 border border-white/5 shadow-2xl overflow-hidden aspect-[16/10] backdrop-blur-sm group"
                >
                    {/* Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/0 to-white/0 opacity-50 pointer-events-none z-50 rounded-[2rem]" />

                    {/* Header */}
                    <div className="h-14 border-b border-white/5 bg-black/40 flex items-center justify-between px-6 relative z-10">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={authenticated ? undefined : login}>
                            <div className={`w-2 h-2 rounded-full ${authenticated ? 'bg-emerald-500' : 'bg-cyan-500'} animate-pulse`} />
                            <span className="text-[10px] font-mono text-cyan-200 uppercase tracking-wider">
                                {authenticated ? 'Standard Access' : 'Connect Wallet'}
                            </span>
                        </div>
                    </div>

                    {/* Inner Content - Mockup */}
                    <div className="flex h-full relative z-10">

                        {/* Main Video Area (LEFT) */}
                        <div className="flex-1 p-6 lg:p-8 relative overflow-hidden flex flex-col gap-6">
                            {/* Background Image */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                <img
                                    src="https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2670&auto=format&fit=crop"
                                    alt="Background"
                                    className="w-full h-full object-cover opacity-20 dark-desaturate"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                            </div>

                            {/* Video Hero */}
                            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-white/10 relative z-10 overflow-hidden shadow-2xl group/video">
                                {/* Thumbnail Image Mockup */}
                                <div className="absolute inset-0 bg-slate-800">
                                    <img
                                        src="https://images.unsplash.com/photo-1541363111435-5c1b7d867904?q=80&w=2670&auto=format&fit=crop"
                                        alt="Video Thumbnail"
                                        className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                                </div>

                                {/* Top Status Bar */}
                                <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
                                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-lg">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-red-500 blur-[4px] opacity-50 animate-pulse" />
                                            <div className="w-2 h-2 rounded-full bg-red-500 relative z-10" />
                                        </div>
                                        <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase text-shadow-sm">Live Premiere</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-black/20 backdrop-blur-md text-[9px] font-bold text-slate-300 border border-white/5 tracking-wider">4K</span>
                                        <span className="px-2 py-1 rounded bg-black/20 backdrop-blur-md text-[9px] font-bold text-slate-300 border border-white/5 tracking-wider">HDR</span>
                                    </div>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
                                    <div className="group/play relative cursor-pointer">
                                        <div className="absolute inset-0 bg-cyan-500/20 blur-[40px] rounded-full scale-0 group-hover/play:scale-150 transition-transform duration-700 ease-out" />
                                        <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-lg flex items-center justify-center border border-white/10 group-hover/play:scale-110 group-hover/play:bg-white/10 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]">
                                            <Play className="w-7 h-7 fill-white text-white ml-1 shadow-lg" />
                                        </div>
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 translate-y-2 group-hover/play:opacity-100 group-hover/play:translate-y-0 transition-all duration-300 whitespace-nowrap">
                                            Watch Trailer
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Bar Mockup */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 flex items-center justify-between gap-4">
                                    <div className="flex-1 flex items-center gap-4">
                                        <Play className="w-4 h-4 text-white fill-white hover:text-cyan-400 transition-colors cursor-pointer" />
                                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                            <div className="w-1/3 h-full bg-gradient-to-r from-cyan-500 to-blue-500 relative">
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-slate-300">3:42 / 12:45</div>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/50">
                                        <Volume2 className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                                        <Maximize className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-4 px-1 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">Premium</span>
                                            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Video</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Monteriggioni: Tuscany's Medieval Gem</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Trending / Recommended Row (New "App Preview" Element) */}
                            <div className="space-y-3 pt-2 relative z-10">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Trending Now
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 1, img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop', title: 'Neon Dreams' },
                                        { id: 2, img: 'https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=400&auto=format&fit=crop', title: 'Cyber Future' },
                                        { id: 3, img: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=400&auto=format&fit=crop', title: 'Digital Mind' }
                                    ].map((item) => (
                                        <div key={item.id} className="group/thumb cursor-pointer space-y-2">
                                            <div className="aspect-video rounded-lg bg-slate-800 border border-white/5 overflow-hidden relative">
                                                <img
                                                    src={item.img}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 group-hover/thumb:scale-110 transition-all duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                                                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 backdrop-blur text-[8px] font-mono text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                    2:45
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-3/4 bg-white/5 rounded-full group-hover/thumb:bg-white/10 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar (RIGHT) */}
                        <div className="w-24 lg:w-80 border-l border-white/5 bg-black/20 p-6 hidden md:flex flex-col gap-8">

                            {/* Creator Card */}
                            <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden relative group/creator">
                                <div className="absolute inset-0 opacity-40 group-hover/creator:opacity-50 transition-opacity duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop"
                                        alt="Creator BG"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
                                </div>
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
                                            <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                                                <img src="https://api.dicebear.com/7.x/shapes/svg?seed=NomadSpark" className="w-full h-full object-cover" alt="Channel" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase text-cyan-200 font-bold tracking-wider">Creator</div>
                                            <div className="text-sm font-bold text-white shadow-black drop-shadow-md">NomadSpark</div>
                                        </div>
                                    </div>
                                    <div className="h-9 w-full rounded-lg bg-white text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg">
                                        View Channel
                                    </div>
                                </div>
                            </div>

                            {/* Up Next List */}
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                    More from NomadSpark
                                </div>

                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 items-center group/item cursor-pointer">
                                        <div className="w-20 aspect-video rounded-md bg-white/10 border border-white/5 overflow-hidden relative">
                                            {/* Dummy thumbnail */}
                                            <img
                                                src={`https://images.unsplash.com/photo-${i === 1 ? '1605379399642-870262d3d051' : i === 2 ? '1523906834658-6e24ef2386f9' : '1476514525535-07fb3b4ae5f1'}?q=80&w=300&auto=format&fit=crop`}
                                                alt=""
                                                className="w-full h-full object-cover opacity-70 group-hover/item:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-11/12 bg-white/10 rounded-full group-hover/item:bg-cyan-500/30 transition-colors" />
                                            <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Floor Reflection/Glow */}
                <div className="absolute -bottom-[20%] left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[80px] -z-10 opacity-60" />

                {/* Partner Logos / Trust Badges - Bottom Position */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-16 md:mt-24 relative z-30 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 pb-10"
                >
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 items-center">
                        <span className="text-lg font-serif italic font-bold">Lighthouse</span>
                        <span className="text-lg font-mono font-bold tracking-widest">BASE</span>
                        <span className="text-lg font-sans font-black tracking-tighter">Privy</span>
                        <span className="text-lg font-serif">IPFS</span>
                    </div>
                </motion.div>

            </motion.div >

        </section >
    );
}
