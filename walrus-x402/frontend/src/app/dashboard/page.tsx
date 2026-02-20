"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Users, DollarSign, Video, Settings, Upload } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

// Helper to format currency
const formatCurrency = (amount: bigint) => {
    if (!amount) return '0.0000';
    return parseFloat(formatUnits(amount, 6)).toFixed(4);
};

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [isClient, setIsClient] = useState(false);
    const [newPrice, setNewPrice] = useState('');

    // Initial client-side check
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetch Creator Details
    const { data: creatorData, isLoading: isLoadingCreator, refetch: refetchCreator } = useReadContract({
        address: CREATOR_HUB_ADDRESS,
        abi: CREATOR_HUB_ABI,
        functionName: 'cret',
        args: [address],
        query: {
            enabled: !!address,
        }
    });

    // Fetch All Content to filter for my content
    // Note: ideally we'd have a contract function for "getMyContent", but filtering works for now
    const { data: allContent, isLoading: isLoadingContent } = useReadContract({
        address: CREATOR_HUB_ADDRESS,
        abi: CREATOR_HUB_ABI,
        functionName: 'getLatestContent',
        args: [BigInt(100)], // Fetch last 100 items
    });

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isUpdating, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isUpdateSuccess) {
            setNewPrice('');
            refetchCreator();
        }
    }, [isUpdateSuccess, refetchCreator]);

    // Handle Price Update
    const handleUpdatePrice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrice) return;

        try {
            writeContract({
                address: CREATOR_HUB_ADDRESS,
                abi: CREATOR_HUB_ABI,
                functionName: 'setSubscriptionPrice',
                args: [parseUnits(newPrice, 6)]
            });
        } catch (error) {
            console.error("Error updating price:", error);
        }
    };

    if (!isClient) return null;

    if (!isConnected) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                    <p className="text-slate-400">Please connect your wallet to access the dashboard.</p>
                </div>
            </div>
        );
    }

    if (isLoadingCreator) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
        );
    }

    // Check if registered
    // creatorData array: [name, wallet, isRegistered, subscriptionPrice, subscriberCount, totalEarnings]
    const isRegistered = creatorData ? (creatorData as any)[2] : false;

    if (!isRegistered) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-center md:max-w-md mx-auto p-10 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <h1 className="text-3xl font-bold text-white mb-4">Become a Creator</h1>
                    <p className="text-slate-400 mb-8">Register your profile to start uploading content and earning from subscriptions.</p>
                    <Link href="/upload" className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:opacity-90 transition-opacity">
                        Register Now
                    </Link>
                </div>
            </div>
        );
    }

    const name = (creatorData as any)[0];
    const subscriptionPrice = (creatorData as any)[3];
    const subscriberCount = (creatorData as any)[4];
    const totalEarnings = (creatorData as any)[5];

    // Filter My Content
    const myContent = allContent
        ? (allContent as any[]).filter((c: any) => c.creatorAddress === address)
        : [];

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-2">
                        Creator Dashboard
                    </h1>
                    <p className="text-slate-400 text-lg font-light">
                        Welcome back, <span className="text-white font-medium">{name}</span>.
                    </p>
                </div>
                <Link
                    href="/upload"
                    className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-slate-950 font-bold shadow-[0_0_30px_-5px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-105"
                >
                    <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                    <span>Upload Content</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Earnings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 backdrop-blur-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-24 bg-green-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-green-500/20 transition-colors" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-green-100">Total Earnings</h3>
                    </div>
                    <p className="text-5xl font-black text-white relative z-10 tracking-tight">{formatCurrency(totalEarnings)} <span className="text-xl text-green-400/60 font-medium">USDC</span></p>
                </motion.div>

                {/* Subscribers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 backdrop-blur-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-24 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-purple-100">Subscribers</h3>
                    </div>
                    <p className="text-5xl font-black text-white relative z-10 tracking-tight">{subscriberCount.toString()}</p>
                </motion.div>

                {/* Content Count */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 backdrop-blur-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-24 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                            <Video size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-blue-100">Total Content</h3>
                    </div>
                    <p className="text-5xl font-black text-white relative z-10 tracking-tight">{myContent.length}</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Column */}
                <div className="lg:col-span-1">
                    <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-sm h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <Settings className="text-slate-400" />
                            <h2 className="text-xl font-bold text-white">Settings</h2>
                        </div>

                        <div className="mb-8 p-6 rounded-2xl bg-black/20 border border-white/5">
                            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Current Price</label>
                            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(subscriptionPrice)} USDC</div>
                            <p className="text-sm text-slate-500">Approx. ${(parseFloat(formatUnits(subscriptionPrice, 6)) * 1).toFixed(2)} USD</p>
                        </div>

                        <form onSubmit={handleUpdatePrice}>
                            <div className="mb-6">
                                <label className="block text-slate-400 text-sm font-bold mb-3">Update Monthly Price (USDC)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.001"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdating || !newPrice}
                                className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 hover:border-white/20"
                            >
                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-2">
                    <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-sm min-h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white">Your Content</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Live on Lighthouse</span>
                            </div>
                        </div>

                        {isLoadingContent ? (
                            <div className="flex justify-center p-20">
                                <Loader2 className="w-10 h-10 text-slate-600 animate-spin" />
                            </div>
                        ) : myContent.length > 0 ? (
                            <div className="space-y-3">
                                {myContent.map((item: any) => {
                                    const isActive = item.active;
                                    const isLegacy = item.cType === undefined;

                                    if (!isActive && !isLegacy) return null;

                                    return (
                                        <div key={item.id.toString()} className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors group">
                                            <div className="w-16 h-12 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/5">
                                                <Video size={20} className="text-slate-500" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-white font-bold truncate">{item.id.toString()}</h3>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.isFree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                        {item.isFree ? 'Free' : 'Premium'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono">
                                                    {isLegacy ? 'Legacy Protocol' : 'Verified Asset'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/creators/${address}`} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="View">
                                                    <Video size={16} />
                                                </Link>
                                                {!isLegacy && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (confirm('Delete content?')) {
                                                                writeContract({
                                                                    address: CREATOR_HUB_ADDRESS,
                                                                    abi: CREATOR_HUB_ABI,
                                                                    functionName: 'setContentActive',
                                                                    args: [item.id, false]
                                                                });
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                    <Video className="text-slate-600" size={24} />
                                </div>
                                <p className="text-slate-500 mb-6 max-w-sm">You haven't uploaded any content yet. Start sharing your work to earn today.</p>
                                <Link href="/upload" className="text-cyan-400 hover:text-cyan-300 font-bold text-sm uppercase tracking-wider border-b border-cyan-500/30 hover:border-cyan-500">
                                    Upload First Video
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
