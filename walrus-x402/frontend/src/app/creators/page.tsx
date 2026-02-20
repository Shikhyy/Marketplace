'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, ShieldCheck, Upload, Wallet, Sparkles } from 'lucide-react';
import { useCreators } from '@/hooks/useCreators';
import { formatUnits } from 'viem';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50, damping: 20 } }
};

export default function CreatorsPage() {
    const { creators, isLoading } = useCreators();

    return (
        <div className="space-y-16 max-w-7xl mx-auto px-4 md:px-6">
            {/* Premium Header */}
            <div className="relative py-16 text-center -mx-4 md:-mx-6 px-4 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[120px] -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 border border-cyan-500/20"
                >
                    <Users className="w-3 h-3" />
                    <span>Community</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-6 drop-shadow-2xl"
                >
                    Featured Creators
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed mb-10"
                >
                    Discover and support the best thinkers and artists on the decentralized web.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        href="/upload"
                        className="inline-flex px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)] hover:scale-105 items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Become a Creator
                    </Link>
                </motion.div>
            </div>

            {/* Creators Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-500">Loading creators...</div>
            ) : creators && creators.length > 0 ? (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {creators.map((creator) => (
                        <motion.div
                            key={creator.wallet}
                            variants={itemAnim}
                        >
                            <Link href={`/creators/${creator.wallet}`} className="group block h-full bg-slate-900/40 backdrop-blur rounded-3xl border border-white/5 hover:border-cyan-500/30 p-8 transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-cyan-500 transition-all bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-3xl font-serif italic shadow-xl">
                                            {creator.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors flex items-center gap-1.5 backdrop-blur-sm">
                                            <Wallet className="w-3 h-3" />
                                            {creator.wallet.slice(0, 6)}...
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors flex items-center gap-2 tracking-tight">
                                        {creator.name}
                                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                    </h3>

                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                                            {formatUnits(creator.subscriptionPrice, 6)} USDC / mo
                                        </div>
                                        {/* Optional: Add subscriber count if available */}
                                        {/* <div className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3"/> 1.2k Subs</div> */}
                                    </div>

                                    <div className="flex items-center justify-between text-sm pt-6 border-t border-white/5">
                                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">View Content</span>
                                        <span className="flex items-center gap-2 text-cyan-500 font-bold group-hover:translate-x-1 transition-transform">
                                            Visit Channel <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-32 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                    <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No creators found. Be the first to join!</p>
                </div>
            )}
        </div>
    );
}
