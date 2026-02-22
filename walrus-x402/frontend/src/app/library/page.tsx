'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import { Loader2, Play, Lock, Clock, CheckCircle } from 'lucide-react';

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

interface ContentItem {
    id: string;
    title: string;
    description: string;
    thumbnailCID: string;
    creatorAddress: string;
    type: string;
    timestamp: number;
    expiry?: number; // Rental expiry (0 = permanent)
    isRental: boolean;  // true = 24h rent, false = permanent buy or subscription
    isPurchased: boolean; // true = outright buy (permanent)
}

export default function LibraryPage() {
    const { ready, authenticated, user } = usePrivy();
    const [loading, setLoading] = useState(true);
    const [libraryContent, setLibraryContent] = useState<ContentItem[]>([]);

    useEffect(() => {
        if (!ready || !authenticated || !user?.wallet?.address) return;

        async function fetchLibrary() {
            try {
                setLoading(true);
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                // 1. Fetch available content (Limit 50 for MVP)
                // @ts-ignore
                const rawContent: any[] = await client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'getLatestContent',
                    args: [50]
                });

                const myItems: ContentItem[] = [];

                // 2. Check Access for each item
                // This is parallelized for speed

                // Load Local Proofs
                const storageKeyRentals = `rentals_${user?.wallet?.address}`;
                const storedRentals = JSON.parse(localStorage.getItem(storageKeyRentals) || '{}');

                const storageKeySubs = `subscriptions_${user?.wallet?.address}`;
                const storedSubs = JSON.parse(localStorage.getItem(storageKeySubs) || '{}');

                const checks = rawContent.map(async (c: any) => {
                    if (!c.active) return null;

                    try {
                        const contentId = c.id.toString();
                        const creator = c.creatorAddress.toLowerCase();

                        let isRented = false;
                        let isSubscribed = false;
                        let expiryTimestamp = 0;

                        // A. Check Local Storage First (Direct Payments)
                        const rentalEntry = storedRentals[contentId];
                        let isPurchased = false;
                        if (rentalEntry) {
                            if (typeof rentalEntry === 'string') {
                                // Legacy format: treat as expired
                                isRented = false;
                            } else if (rentalEntry.timestamp) {
                                if (rentalEntry.type === 'buy') {
                                    // Permanent purchase — always valid
                                    isRented = true;
                                    isPurchased = true;
                                    expiryTimestamp = 0; // no expiry
                                } else {
                                    // Rental — 24h window
                                    const now = Date.now();
                                    const rentDuration = 24 * 60 * 60 * 1000;
                                    if (now - rentalEntry.timestamp < rentDuration) {
                                        isRented = true;
                                        expiryTimestamp = Math.floor((rentalEntry.timestamp + rentDuration) / 1000);
                                    } else {
                                        isRented = false;
                                    }
                                }
                            }
                        }

                        const subProof = storedSubs[creator];
                        if (subProof) {
                            const now = Date.now();
                            const subscribedAt = subProof.timestamp;
                            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                            if (now - subscribedAt < thirtyDaysMs) {
                                isSubscribed = true;
                                expiryTimestamp = Math.floor((subscribedAt + thirtyDaysMs) / 1000);
                            }
                        }


                        // B. Check Contract (Primary Source for "Perfect Blockchain Features")
                        if (!isRented && !isSubscribed) {
                            try {
                                const rentalExpiryBigInt = await client.readContract({
                                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                    abi: CREATOR_HUB_ABI,
                                    functionName: 'rentals',
                                    args: [user?.wallet?.address as `0x${string}`, BigInt(contentId)]
                                });

                                const rentalExpiry = Number(rentalExpiryBigInt);
                                if (rentalExpiry > Date.now() / 1000) {
                                    isRented = true;
                                    expiryTimestamp = rentalExpiry;
                                }

                                const isSub = await client.readContract({
                                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                    abi: CREATOR_HUB_ABI,
                                    functionName: 'checkSubscription',
                                    args: [user?.wallet?.address as `0x${string}`, c.creatorAddress as `0x${string}`]
                                });
                                if (isSub) isSubscribed = true;

                            } catch (err: any) {
                                console.warn(`Contract check failed for ${contentId}`, err);
                            }
                        }

                        if (isRented || isSubscribed) {
                            // Fetch Metadata if access confirmed
                            try {
                                const cid = c.metadataURI.replace('ipfs://', '');
                                const gatewayUrl = `${GATEWAY}${cid}`;
                                const res = await fetch(gatewayUrl);
                                const meta = await res.json();

                                return {
                                    id: c.id.toString(),
                                    title: meta.title || "Untitled",
                                    description: meta.description || "",
                                    thumbnailCID: meta.thumbnail ? meta.thumbnail.replace('ipfs://', '') : '',
                                    creatorAddress: c.creatorAddress,
                                    type: meta.contentType || 'video',
                                    timestamp: meta.createdAt || Date.now(),
                                    expiry: expiryTimestamp,
                                    isRental: isRented && !isPurchased,
                                    isPurchased,
                                } as ContentItem;
                            } catch (e) {
                                console.error("Metadata error", e);
                                return null;
                            }
                        }
                    } catch (e) {
                        return null;
                    }
                    return null;
                });

                const results = await Promise.all(checks);
                // Filter out nulls AND check expiry again just to be safe

                const founded = results.filter((item) => {
                    if (!item) return false;
                    // Permanent purchases never expire from the library
                    if (item.isPurchased) return true;
                    // Rentals: filter out if past 24h window
                    if (item.isRental && item.expiry && item.expiry < Date.now() / 1000) {
                        return false;
                    }
                    return true;
                }) as ContentItem[];

                // Sort by ID descending
                setLibraryContent(founded.sort((a, b) => Number(b.id) - Number(a.id)));

            } catch (error) {
                console.error("Library fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLibrary();
    }, [ready, authenticated, user]);

    if (!ready) return null;

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Please Connect Wallet</h1>
                    <p className="text-slate-400">You need to sign in to view your library.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 bg-slate-950 max-w-7xl mx-auto">
            {/* Premium Header */}
            <div className="relative py-12 md:py-20 text-center mb-12">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/10 blur-[100px] -z-10" />
                <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight mb-4 drop-shadow-2xl">
                    My Library
                </h1>
                <p className="text-slate-400 text-lg font-light">
                    Your collection of rented and subscribed decentralized content.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : libraryContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
                    {libraryContent.map((item, i) => (
                        <Link href={`/content/${item.id}`} key={item.id} className="group block">
                            <div className="bg-slate-900/40 backdrop-blur rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/40 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.15)] hover:-translate-y-2 flex flex-col h-full">
                                {/* Thumbnail */}
                                <div className="aspect-[16/10] bg-slate-800 relative overflow-hidden">
                                    {item.thumbnailCID ? (
                                        <img
                                            src={`${GATEWAY}${item.thumbnailCID}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Play className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-transform">
                                            <Play className="w-6 h-6 fill-white ml-1" />
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${item.isPurchased
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                                : item.isRental
                                                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                                                    : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                            }`}>
                                            {item.isPurchased ? 'Owned' : item.isRental ? 'Rental' : 'Subscriber'}
                                        </span>
                                    </div>

                                    {/* Rental countdown — only for time-limited rentals */}
                                    {item.isRental && !item.isPurchased && item.expiry && item.expiry > Date.now() / 1000 && (
                                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-full text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
                                            <Clock className="w-3 h-3" />
                                            {`${Math.ceil((item.expiry - Date.now() / 1000) / 3600)}h left`}
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="font-bold text-lg text-white mb-2 leading-tight group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="mt-auto flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span>Access Unlocked</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-slate-800 rounded-[3rem] bg-slate-900/30 max-w-4xl mx-auto">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Library Empty</h3>
                    <p className="text-slate-400 mb-8 max-w-md text-center">You haven't unlocked any content yet. Support creators to start building your collection.</p>
                    <Link href="/explore" className="px-8 py-4 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]">
                        Explore Creators
                    </Link>
                </div>
            )}
        </div>
    );
}
