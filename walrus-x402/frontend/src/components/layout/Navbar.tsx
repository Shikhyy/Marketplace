'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, LogOut, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Navbar() {
    const { login, logout, authenticated, ready, user } = usePrivy();
    const pathname = usePathname();

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const navLinks = [
        { href: '/explore', label: 'Explore' },
        { href: '/creators', label: 'Creators' },
        ...(authenticated ? [{ href: '/library', label: 'My Library' }] : [])
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
        >
            <div className="w-full max-w-5xl rounded-full bg-slate-950/70 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 px-6 h-16 flex items-center justify-between relative overflow-hidden">
                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group relative z-10">
                    <div className="relative w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <Image src="/logo.png" alt="ContentHub" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-white tracking-tight text-lg">x402</span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === link.href ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {link.label}
                            {pathname === link.href && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-inner"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 relative z-10">
                    {!ready ? (
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                    ) : authenticated ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/10 group cursor-default">
                                <Wallet className="w-3.5 h-3.5 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm font-mono text-slate-300">
                                    {user?.wallet?.address ? truncateAddress(user.wallet.address) : 'No Wallet'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="group relative px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)] overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Connect Wallet
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                        </button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
