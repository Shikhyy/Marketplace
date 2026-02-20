'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Music, FileText, Lock, Unlock, Search, Loader2, Sparkles } from 'lucide-react';
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY, USDC_SEPOLIA_ADDRESS } from '@/config/constants';

// Data Interface
interface VideoContent {
    id: string;
    title: string;
    description?: string;
    creator: string;
    creatorAddress: string;
    type: 'video' | 'audio' | 'article';
    tier: 'premium' | 'basic' | 'free';
    thumbnail: string;
    duration: string;
    videoCID?: string; // Legacy
    metadataURI?: string; // Premium
    price?: string;
    paymentToken?: string;
    isLegacy: boolean;
}

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

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
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
};

export default function ExplorePage() {
    const [filter, setFilter] = useState('all');
    const [items, setItems] = useState<VideoContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                // Parallel fetch: Latest Videos (Legacy) & Latest Content (Premium)
                const [rawVideos, rawContent] = await Promise.all([
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [20]
                    }) as Promise<any[]>,
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestContent',
                        args: [20]
                    }) as Promise<any[]>
                ]);

                const formattedItems: VideoContent[] = [];

                // 1. Process Legacy Videos
                if (rawVideos && rawVideos.length > 0) {
                    for (const v of rawVideos) {
                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [v.uploader]
                            }) as string;
                        } catch (e) { }

                        formattedItems.push({
                            id: v.videoCID,
                            title: v.title,
                            creator: channelName || "Creator",
                            creatorAddress: v.uploader,
                            type: 'video',
                            tier: 'free',
                            thumbnail: `${GATEWAY}${v.thumbnailCID}`,
                            duration: new Date(Number(v.timestamp) * 1000).toLocaleDateString(),
                            videoCID: v.videoCID,
                            isLegacy: true
                        });
                    }
                }

                // 2. Process Premium Content
                if (rawContent && rawContent.length > 0) {
                    const contentPromises = rawContent.map(async (c: any) => {
                        if (!c.active) return null;
                        try {
                            const cid = c.metadataURI.replace('ipfs://', '');
                            const metadataUrl = `${GATEWAY}${cid}`;
                            const res = await fetch(metadataUrl);
                            const metadata = await res.json();

                            let channelName = "Unknown Creator";
                            try {
                                channelName = await client.readContract({
                                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                    abi: CREATOR_HUB_ABI,
                                    functionName: 'getChannelName',
                                    args: [c.creatorAddress]
                                }) as string;
                            } catch (e) { }

                            return {
                                id: c.id.toString(),
                                title: metadata.title || "Untitled",
                                description: metadata.description,
                                creator: channelName || "Creator",
                                creatorAddress: c.creatorAddress,
                                type: metadata.contentType || 'video',
                                tier: c.isFree ? 'free' : 'premium',
                                thumbnail: metadata.thumbnail ? metadata.thumbnail.replace('ipfs://', GATEWAY) : '',
                                duration: new Date(metadata.createdAt || Date.now()).toLocaleDateString(),
                                metadataURI: c.metadataURI,
                                price: c.fullPrice.toString(),
                                paymentToken: c.paymentToken,
                                isLegacy: false
                            } as VideoContent;
                        } catch (err) {
                            return null;
                        }
                    });

                    const processedContent = (await Promise.all(contentPromises)).filter(Boolean) as VideoContent[];
                    formattedItems.push(...processedContent);
                }

                setItems(formattedItems);
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-6">
            {/* Premium Header */}
            <div className="relative py-16 md:py-24 text-center overflow-hidden -mx-4 md:-mx-6 px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[120px] -z-10" />
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-6 drop-shadow-2xl"
                >
                    Explore Content
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-400 max-w-2xl mx-auto font-light"
                >
                    Discover the best Web3 long-form content. <br className="hidden md:block" /> Owned by you, directly from creators.
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-md mx-auto mt-10 relative"
                >
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-50" />
                    <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-cyan-500/50 transition-colors backdrop-blur-md">
                        <Search className="w-5 h-5 text-slate-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Find creators or content..."
                            className="bg-transparent border-none focus:outline-none text-white placeholder-slate-500 w-full text-lg"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex justify-center">
                <div className="inline-flex p-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                    {['all', 'video', 'audio', 'article'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium capitalize transition-all duration-300 ${filter === f
                                ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-32 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-lg">No content found yet.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20"
                >
                    {items.filter(c => filter === 'all' || c.type === filter).map((item) => (
                        <motion.div
                            key={`${item.isLegacy ? 'leg' : 'prem'}-${item.id}`}
                            variants={itemAnim}
                        >
                            <Link href={`/content/${item.isLegacy ? 'legacy-' : ''}${item.id}`} className="group block h-full">
                                <div className="relative h-full bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 flex flex-col">

                                    {/* Thumbnail */}
                                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-800">
                                        <div className="absolute inset-0 bg-slate-900 animate-pulse" /> {/* Placeholder loading */}
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                                        {/* Floating Badge */}
                                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                                            {item.type === 'video' && <Play className="w-4 h-4 fill-current" />}
                                            {item.type === 'audio' && <Music className="w-4 h-4" />}
                                            {item.type === 'article' && <FileText className="w-4 h-4" />}
                                        </div>

                                        {/* Duration */}
                                        <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-xs font-mono text-white/90 border border-white/10">
                                            {item.duration}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.tier === 'premium' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' :
                                                item.tier === 'basic' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                    'border-slate-700 text-slate-400 bg-slate-800/50'
                                                }`}>
                                                {item.tier}
                                            </div>
                                            {item.price && item.tier !== 'free' && (
                                                <div className="text-cyan-400 text-sm font-mono font-bold">
                                                    {item.paymentToken?.toLowerCase() === USDC_SEPOLIA_ADDRESS.toLowerCase()
                                                        ? `${parseFloat(formatUnits(BigInt(item.price), 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
                                                        : `${parseFloat(formatUnits(BigInt(item.price), 6)).toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>

                                        {item.description && (
                                            <p className="text-slate-400 text-sm line-clamp-2 mb-6 font-light">{item.description}</p>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-2 ring-black flex items-center justify-center text-xs font-bold text-white">
                                                {item.creator.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{item.creator}</p>
                                                <p className="text-xs text-slate-500 truncate font-mono">{item.creatorAddress.slice(0, 6)}...{item.creatorAddress.slice(-4)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
