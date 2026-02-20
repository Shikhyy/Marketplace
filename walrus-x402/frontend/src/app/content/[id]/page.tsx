'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Loader2, Lock, Play, Pause, Volume2, Maximize, User, ShieldCheck, CheckCircle, AlertCircle, Share2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY, USDC_SEPOLIA_ADDRESS, CHAIN_ID, MOCK_PRICE_USDC } from '@/config/constants';
import { useX402 } from '@/hooks/useX402';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentData {
    id: string;
    title: string;
    description: string;
    creator: string;
    creatorAddress: string;
    type: 'video' | 'audio' | 'article';
    isPremium: boolean;
    price: string; // in wei
    rentPrice: string; // in wei
    videoCID: string;
    thumbnailCID: string;
    timestamp: number;
    paymentToken: string;
    isLegacy?: boolean;
}

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

export default function ContentPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { getAccessToken, authenticated, login, user } = usePrivy();
    const { wallets } = useWallets();
    const { handlePayment, paymentState, error: paymentError } = useX402();
    const paymentLoading = paymentState !== 'idle' && paymentState !== 'success' && paymentState !== 'error';

    const addTokenToWallet = async () => {
        if (!wallets?.[0]) return;
        try {
            const provider = await wallets[0].getEthereumProvider();
            await provider.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: USDC_SEPOLIA_ADDRESS,
                        symbol: 'USDC',
                        decimals: 6,
                        image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=024',
                    },
                } as any,
            });
        } catch (error) {
            console.error("Failed to add token", error);
        }
    };

    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [verifyingAccess, setVerifyingAccess] = useState(true); // New state to prevent flash
    const [content, setContent] = useState<ContentData | null>(null);
    const [streamUrl, setStreamUrl] = useState<string | null>(null);

    const [error, setError] = useState('');
    const [relatedContent, setRelatedContent] = useState<ContentData[]>([]);

    // Purchase Options State
    const [purchaseType, setPurchaseType] = useState<'rent' | 'buy'>('rent');
    const [isPaying, setIsPaying] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        async function fetchContent() {
            try {
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                const idParam = params.id;
                const isLegacy = idParam.startsWith('legacy-');

                let fetchedContent: ContentData | null = null;

                if (isLegacy) {
                    const cid = idParam.replace('legacy-', '');
                    // Heuristic: Fetch latest 50 videos and match CID
                    // @ts-ignore
                    const rawVideos: any[] = await client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [50]
                    });

                    const match = rawVideos.find((v: any) => v.videoCID === cid);
                    if (match) {
                        // Fetch Channel Name
                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [match.uploader]
                            }) as string;
                        } catch (e) { }

                        fetchedContent = {
                            id: cid,
                            title: match.title,
                            description: "Legacy Showcase Video",
                            creator: channelName || "Creator",
                            creatorAddress: match.uploader,
                            type: 'video',
                            isPremium: false,
                            price: '0',
                            rentPrice: String(MOCK_PRICE_USDC), // USDC in micro amounts
                            videoCID: match.videoCID,
                            thumbnailCID: match.thumbnailCID,
                            timestamp: Number(match.timestamp),
                            paymentToken: USDC_SEPOLIA_ADDRESS,
                            isLegacy: true
                        };
                        setAuthorized(true); // Legacy is always free
                    }

                } else {
                    // Premium Content (Numeric ID)
                    const contentId = BigInt(idParam);
                    // @ts-ignore
                    const rawContent = await client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'contents',
                        args: [contentId]
                    }) as any; // Struct tuple

                    const [id, creator, cType, metadataURI, isFree, fullPrice, rentedPrice, paymentToken, active] = rawContent;

                    if (active) {
                        // Fetch Metadata
                        let metadata: any = {};
                        try {
                            const gatewayUrl = metadataURI.startsWith('http')
                                ? metadataURI
                                : metadataURI.startsWith('ipfs://')
                                    ? metadataURI.replace('ipfs://', GATEWAY)
                                    : `${GATEWAY}${metadataURI}`;

                            // console.log('Fetching metadata:', { metadataURI, gatewayUrl }); // Removed for privacy
                            const metaRes = await fetch(gatewayUrl);

                            if (!metaRes.ok) {
                                throw new Error(`Gateway returned ${metaRes.status}`);
                            }

                            const contentType = metaRes.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                metadata = await metaRes.json();
                            } else {
                                // Fallback: Try text and parse, or log error
                                const text = await metaRes.text();
                                try {
                                    metadata = JSON.parse(text);
                                } catch (e) {
                                    console.error('Failed to parse metadata JSON. Response start:', text.substring(0, 100));
                                    throw new Error('Invalid JSON metadata');
                                }
                            }
                        } catch (e) {
                            console.error("Metadata fetch error:", e);
                            // Set default/fallback metadata so the page doesn't crash completely
                            metadata = {
                                title: `Content #${id.toString()}`,
                                description: "Metadata unavailable",
                                contentType: 'video'
                            };
                        }

                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [creator]
                            }) as string;
                        } catch (e) { }

                        fetchedContent = {
                            id: id.toString(),
                            title: metadata.title || "Untitled",
                            description: metadata.description || "",
                            creator: channelName || "Creator",
                            creatorAddress: creator,
                            type: metadata.contentType || 'video',
                            isPremium: !isFree,
                            price: fullPrice.toString(),
                            rentPrice: rentedPrice.toString(),
                            videoCID: metadata.video ? metadata.video.replace('ipfs://', '') : '',
                            thumbnailCID: metadata.thumbnail ? metadata.thumbnail.replace('ipfs://', '') : '',
                            timestamp: metadata.createdAt ? Math.floor(metadata.createdAt / 1000) : Math.floor(Date.now() / 1000),
                            paymentToken: paymentToken
                        };

                        if (isFree) setAuthorized(true);
                        else setAuthorized(false);
                    }
                }

                if (!fetchedContent) {
                    setError("Content not found.");
                } else {
                    setContent(fetchedContent);
                    // Default to Buy if Rent is not available
                    if (Number(fetchedContent.rentPrice) === 0) {
                        setPurchaseType('buy');
                    }
                    // Fetch related content
                    fetchRelatedContent(client, fetchedContent.creatorAddress, fetchedContent.id);
                }

            } catch (e) {
                console.error(e);
                setError("Failed to load content.");
            } finally {
                setLoading(false);
            }
        }

        async function fetchRelatedContent(client: any, creatorAddress: string, currentId: string) {
            try {
                // Fetch both legacy and premium to mix
                const [rawVideos, rawContent] = await Promise.all([
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [50]
                    }) as Promise<any[]>,
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestContent',
                        args: [50]
                    }) as Promise<any[]>
                ]);

                const related: ContentData[] = [];

                // Process Legacy
                if (rawVideos) {
                    const myVideos = rawVideos.filter((v: any) => v.uploader.toLowerCase() === creatorAddress.toLowerCase() && v.videoCID !== currentId);
                    related.push(...myVideos.map((v: any) => ({
                        id: v.videoCID,
                        title: v.title,
                        description: "",
                        creator: "Creator",
                        creatorAddress: v.uploader,
                        type: 'video' as const,
                        isPremium: false,
                        price: '0',
                        rentPrice: '0',
                        videoCID: v.videoCID,
                        thumbnailCID: v.thumbnailCID,
                        timestamp: Number(v.timestamp),
                        paymentToken: '0x0',
                        isLegacy: true
                    })));
                }

                // Process Premium
                if (rawContent) {
                    const myContent = rawContent.filter((c: any) =>
                        c.creatorAddress.toLowerCase() === creatorAddress.toLowerCase() &&
                        c.active &&
                        c.id.toString() !== currentId
                    );

                    // We need metadata for titles/thumbnails
                    // Limiting to 6 for performance
                    const promises = myContent.slice(0, 6).map(async (c: any) => {
                        try {
                            const cid = c.metadataURI.replace('ipfs://', '');
                            const gatewayUrl = `${GATEWAY}${cid}`;
                            const res = await fetch(gatewayUrl);
                            const meta = await res.json();
                            return {
                                id: c.id.toString(),
                                title: meta.title || "Untitled",
                                description: meta.description || "",
                                creator: "Creator",
                                creatorAddress: c.creatorAddress,
                                type: meta.contentType || 'video',
                                isPremium: !c.isFree,
                                price: c.fullPrice.toString(),
                                rentPrice: c.rentedPrice.toString(),
                                videoCID: meta.video ? meta.video.replace('ipfs://', '') : '',
                                thumbnailCID: meta.thumbnail ? meta.thumbnail.replace('ipfs://', '') : '',
                                timestamp: meta.createdAt ? Math.floor(meta.createdAt / 1000) : Math.floor(Date.now() / 1000),
                                paymentToken: c.paymentToken,
                                isLegacy: false
                            } as ContentData;
                        } catch (e) { return null; }
                    });

                    const resolved = (await Promise.all(promises)).filter(Boolean) as ContentData[];
                    related.push(...resolved);
                }

                // Sort by date desc and take top 6
                setRelatedContent(related.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6));

            } catch (e) {
                console.error("Failed to load related content", e);
            }
        }

        fetchContent();
    }, [params.id]);

    const verifyAccess = useCallback(async () => {
        if (!content || !authenticated || !user?.wallet?.address) {
            setVerifyingAccess(false);
            return;
        }

        try {
            setVerifyingAccess(true); // Start verification
            // 1. Check Local Storage "Proof of Payment"
            const storageKeyRentals = `rentals_${user?.wallet?.address}`;
            const storedRentals = JSON.parse(localStorage.getItem(storageKeyRentals) || '{}');
            const rentalEntry = storedRentals[content.id];

            let paymentProof = null;
            if (rentalEntry) {
                if (typeof rentalEntry === 'string') {
                    // Legacy format (no timestamp) -> STRICT: Treated as Expired
                    paymentProof = null;
                } else if (rentalEntry.txHash && rentalEntry.timestamp) {
                    // New format with timestamp: Check strict 24h expiry
                    const now = Date.now();
                    const rentDuration = 24 * 60 * 60 * 1000; // 24 hours
                    if (now - rentalEntry.timestamp < rentDuration) {
                        paymentProof = rentalEntry.txHash;
                    }
                    // Else: Expired locally, no proof used
                }
            }

            // Check Subscription (Not fully supported on P2P backend yet unless we index it, 
            // but we will send the sub tx hash if found. Backend only verifies generic 'txHash')
            if (!paymentProof) {
                const storageKeySubs = `subscriptions_${user?.wallet?.address}`;
                const storedSubs = JSON.parse(localStorage.getItem(storageKeySubs) || '{}');
                const subProof = storedSubs[content.creatorAddress.toLowerCase()]; // { txHash, timestamp }
                if (subProof) {
                    // Check expiry (30 days)
                    if (Date.now() - subProof.timestamp < 30 * 24 * 60 * 60 * 1000) {
                        paymentProof = subProof.hash || subProof.txHash; // Handle both formats if flexible
                    }
                }
            }

            // Even if no proof, call it to see if it's Free (402 check)
            const headers: any = {};
            if (paymentProof) headers['X-PAYMENT'] = paymentProof;

            const res = await fetch(`/api/video/${content.id}`, {
                headers: headers
            });

            if (res.ok) {
                // API redirects or returns 200 with content
                setStreamUrl(res.url);
                setAuthorized(true);
            } else if (res.status === 402) {
                const data = await res.json();
                console.log("[Access] Payment Required:", data);
                setAuthorized(false);
            } else {
                console.warn("[Access] API Error:", res.status);
            }

        } catch (e) {
            console.error("Access verification failed", e);
        } finally {
            setVerifyingAccess(false);
        }
    }, [content, authenticated, user]);

    useEffect(() => {
        verifyAccess();
    }, [verifyAccess]);

    const checkAuthorization = async () => {
        if (!content || !authenticated) return;
        try {
            const token = await getAccessToken();
            const res = await fetch(`/api/content/${params.id}/authorize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    creatorAddress: content.creatorAddress,
                    userWallet: user?.wallet?.address
                })
            });
            const data = await res.json();
            if (data.authorized) setAuthorized(true);
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };

    const handleBuy = async () => {
        if (!content || !wallets.length) {
            toast.error("Please connect your wallet");
            return;
        }

        // Use x402 Hook for standardized payment
        // We set recipient to creatorAddress to ensure Direct Payment
        try {
            const amount = purchaseType === 'rent' ? content.rentPrice : content.price;

            // Payment Metadata
            const metadata = {
                chainId: CHAIN_ID,
                tokenAddress: content.paymentToken, // Use content's payment token
                amount: amount,
                recipient: content.creatorAddress, // DIRECT TO CREATOR
                paymentParameter: {
                    contentId: content.id
                }
            };

            const txHash = await handlePayment(metadata);

            if (txHash) {
                console.log("[Payment] Success:", txHash);

                // Save Proof to Local Storage (Client-side Indexing)
                // Required because Direct Payments don't update contract state immediately/at all
                const storageKey = `rentals_${user?.wallet?.address}`;
                const currentRentals = JSON.parse(localStorage.getItem(storageKey) || '{}');
                currentRentals[content.id] = { txHash, timestamp: Date.now() };
                localStorage.setItem(storageKey, JSON.stringify(currentRentals));

                toast.success("Payment successful! Access granted.");

                // Re-verify immediately with the new proof
                await verifyAccess();
            }

        } catch (e: any) {
            console.error("Payment failed:", e);
            toast.error("Payment failed: " + (e.message || "Unknown error"));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-950">
                <Loader2 className="animate-spin w-10 h-10 text-cyan-500" />
                <p className="text-slate-500 animate-pulse">Loading content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-xl">{error || "Content not found"}</p>
                    <Link href="/explore" className="text-cyan-500 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    const activePrice = purchaseType === 'rent' ? content.rentPrice : content.price;
    const canRent = Number(content.rentPrice) > 0;

    return (
        <div className="min-h-screen bg-slate-950 pb-20 relative overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950/80 z-10" />
                <img
                    src={`${GATEWAY}${content.thumbnailCID}`}
                    className="w-full h-full object-cover blur-3xl opacity-40"
                    alt="Background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20" />
            </div>

            <div className="relative z-30 max-w-7xl mx-auto px-4 md:px-8 pt-6">

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Player & Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl shadow-black/50 border border-white/5 ring-1 ring-white/10">

                            {/* Unlock Animation Overlay */}
                            <AnimatePresence>
                                {verifyingAccess ? (
                                    <motion.div
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 text-center"
                                    >
                                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-2" />
                                        <p className="text-slate-400 text-xs font-medium tracking-wide">Verifying Access...</p>
                                    </motion.div>
                                ) : !authorized && (
                                    <motion.div
                                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center"
                                    >
                                        {!authenticated ? (
                                            <div className="max-w-[260px] w-full relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                                <div className="relative bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl text-center space-y-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto border border-white/5 shadow-inner transform rotate-3 group-hover:rotate-6 transition-transform">
                                                        <Lock className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h2 className="text-lg font-bold text-white">Login Required</h2>
                                                        <p className="text-slate-400 text-xs leading-relaxed">Connect wallet to unlock.</p>
                                                    </div>
                                                    <button onClick={login} className="w-full py-2.5 bg-white text-slate-950 rounded-lg font-bold hover:bg-cyan-50 transition-all shadow-lg shadow-white/10 text-xs uppercase tracking-wide">
                                                        Connect Wallet
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-[300px] w-full relative group">
                                                {/* Gradient Border Glow */}
                                                <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500/50 to-transparent rounded-[26px] blur-sm opacity-50"></div>

                                                <div className="relative bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-1 rounded-3xl shadow-2xl overflow-hidden">
                                                    {/* Background Pattern */}
                                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                                                    <div className="relative p-5 text-center space-y-2">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto border border-indigo-500/30 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
                                                            <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-lg font-black text-white tracking-tight drop-shadow-md">Unlock Content</h2>
                                                            <p className="text-slate-300 font-medium text-xs mt-0.5 drop-shadow-sm">Choose a plan to decrypt and watch.</p>
                                                        </div>
                                                    </div>

                                                    <div className="relative bg-white/[0.03] rounded-2xl p-4 space-y-4 mt-0 border-t border-white/5 mx-1 mb-1 backdrop-blur-sm">
                                                        {/* Custom Tab Switcher */}
                                                        {canRent && (
                                                            <div className="flex p-1 bg-slate-950/80 rounded-xl border border-white/5 relative">
                                                                <button
                                                                    onClick={() => setPurchaseType('rent')}
                                                                    className={`flex-1 relative z-10 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${purchaseType === 'rent' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                                >
                                                                    Rent
                                                                </button>
                                                                <button
                                                                    onClick={() => setPurchaseType('buy')}
                                                                    className={`flex-1 relative z-10 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${purchaseType === 'buy' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                                >
                                                                    Buy
                                                                </button>

                                                                {/* Sliding Background */}
                                                                <div
                                                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-lg shadow-lg border border-white/10 transition-all duration-300 ease-spring ${purchaseType === 'rent' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Price Display */}
                                                        <div className="flex flex-col items-center py-1 space-y-0.5">
                                                            <div className="flex items-end gap-1">
                                                                <span className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
                                                                    {parseFloat(formatEther(BigInt(activePrice))).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-500 mb-1">ETH</span>
                                                            </div>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 rounded-full border ${purchaseType === 'rent' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                                                                {purchaseType === 'rent' ? '24 Hour Access' : 'Lifetime Access (Direct)'}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={handleBuy}
                                                            disabled={paymentLoading || paymentState === 'success'}
                                                            className={`w-full py-3 bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.5)] flex justify-center items-center gap-2 group/btn border border-white/10 ${paymentState === 'error' ? 'from-red-600 to-red-500 hover:from-red-500 hover:to-red-400' : 'from-indigo-600 to-indigo-500'}`}
                                                        >
                                                            {paymentLoading || (paymentState !== 'idle' && paymentState !== 'error') ? (
                                                                <>
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                    <span className="text-sm">
                                                                        {paymentState === 'preparing' && 'Preparing...'}
                                                                        {paymentState === 'signing' && 'Sign in Wallet...'}
                                                                        {paymentState === 'confirming' && 'Confirming...'}
                                                                        {paymentState === 'verifying' && 'Verifying...'}
                                                                        {paymentState === 'success' && 'Success!'}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm uppercase tracking-wider">
                                                                        {paymentState === 'error' ? 'Retry Payment' : (purchaseType === 'rent' ? 'Rent Now' : 'Buy Now')}
                                                                    </span>
                                                                    <ShieldCheck className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Add Token Button */}
                                                        {/* Add Token Button - REMOVED */}

                                                        {paymentError && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg flex items-start gap-2 text-left border border-red-500/20">
                                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                                <span>{paymentError.message}</span>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Video Element */}
                            {authorized && streamUrl ? (
                                isPaying ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black">
                                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                                    </div>
                                ) : isPlaying ? (
                                    <video
                                        src={streamUrl}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                        poster={`${GATEWAY}${content.thumbnailCID}`}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
                                        <img
                                            src={`${GATEWAY}${content.thumbnailCID}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            alt={content.title}
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300">
                                                <Play className="w-8 h-8 fill-white text-white ml-1" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-sm font-medium text-white">
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                <span>Owned & Ready to Play</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <img
                                    src={`${GATEWAY}${content.thumbnailCID}`}
                                    className="w-full h-full object-cover opacity-50 blur-sm pointer-events-none"
                                    alt="Locked Content"
                                />
                            )}
                        </div>

                        {/* Title & Stats */}
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl shadow-black">{content.title}</h1>

                                <div className="flex gap-2">
                                    <button className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                                <span className={`px-2.5 py-1 rounded-md font-bold text-xs uppercase tracking-wider ${content.isPremium ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {content.isPremium ? 'Premium' : 'Free'}
                                </span>
                                <span className="capitalize px-2 py-0.5 rounded bg-white/5">{content.type}</span>
                                <span>{new Date(content.timestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-light text-lg">
                                    {content.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Creator & Related */}
                    <div className="space-y-8">

                        {/* Creator Card */}
                        <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-white/5 backdrop-blur-xl shadow-xl sticky top-6 overflow-hidden">
                            {/* Background Image */}
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop"
                                    alt="Background"
                                    className="w-full h-full object-cover opacity-20"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/80 to-slate-950/90" />
                            </div>

                            <div className="relative z-10 flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                                        <img
                                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${content.creatorAddress}`}
                                            alt={content.creator}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">Creator</div>
                                    <div className="font-bold text-xl text-white truncate">{content.creator}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Wallet className="w-3 h-3" />
                                        {content.creatorAddress.substring(0, 6)}...{content.creatorAddress.substring(content.creatorAddress.length - 4)}
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/creators/${content.creatorAddress}`}
                                className="block w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-center hover:bg-cyan-50 transition-colors shadow-lg shadow-white/5"
                            >
                                View Channel
                            </Link>
                        </div>

                        {/* More from Creator */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Play className="w-5 h-5 text-cyan-500" />
                                More from {content.creator.split(' ')[0]}
                            </h3>
                            <div className="space-y-4">
                                {relatedContent.map((item) => (
                                    <Link key={item.id} href={`/content/${item.isLegacy ? 'legacy-' : ''}${item.id}`} className="block group">
                                        <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="w-32 aspect-video bg-slate-800 rounded-lg overflow-hidden relative shrink-0">
                                                <img
                                                    src={`${GATEWAY}${item.thumbnailCID}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    alt={item.title}
                                                />
                                                {item.isPremium && (
                                                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur rounded px-1.5 py-0.5">
                                                        <Lock className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h4 className="text-white font-medium line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                                                <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                                    <span>{new Date(item.timestamp * 1000).toLocaleDateString()}</span>
                                                    {item.isPremium && (
                                                        <span className="text-indigo-400 font-bold">
                                                            {item.price ? parseFloat(formatEther(BigInt(item.price))).toLocaleString(undefined, { maximumFractionDigits: 6 }) : ''} ETH
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {relatedContent.length === 0 && (
                                    <div className="text-slate-500 text-sm text-center py-4">No other videos found.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}
