'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ArrowRight, Play, Globe, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/landing/Hero';
import FeaturedCreators from '@/components/FeaturedCreators';
import { RollingText } from '@/components/ui/skiper-ui/RollingText';
import { AppleStyleFeature } from '@/components/ui/skiper-ui/AppleStyleFeature';
import { ProjectsShowcase } from '@/components/ui/skiper-ui/ProjectsShowcase';
import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, WALLET_ADDRESS_LENGTH } from '@/config/constants';

interface ShowcaseProject {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
}

export default function Home() {
  const { login, authenticated } = usePrivy();
  const [showcaseProjects, setShowcaseProjects] = useState<ShowcaseProject[]>([]);

  useEffect(() => {
    const fetchLatestContent = async () => {
      try {
        const client = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org')
        });

        // @ts-ignore
        const rawVideos: any[] = await client.readContract({
          address: CREATOR_HUB_ADDRESS as `0x${string}`,
          abi: CREATOR_HUB_ABI,
          functionName: 'getLatestVideos',
          args: [5] // Fetch last 5 videos
        });

        if (rawVideos && rawVideos.length > 0) {
          const mappedProjects: ShowcaseProject[] = rawVideos.map((video: any, index: number) => ({
            id: video.videoCID || `vid-${index}`,
            title: video.title || 'Untitled Video',
            category: "Original",
            description: `Stream now on x402. Uploaded by ${video.uploader?.slice(0, 6)}...${video.uploader?.slice(-4)}`,
            image: video.thumbnailCID
              ? `https://gateway.lighthouse.storage/ipfs/${video.thumbnailCID}`
              : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          }));

          // Only take the first 4 for the showcase to keep it clean
          setShowcaseProjects(mappedProjects.slice(0, 4));
        } else {
          // Fallback if no content exists yet (empty state)
          setShowcaseProjects([]);
        }

      } catch (error) {
        console.error("Error fetching latest content:", error);
      }
    };

    fetchLatestContent();
  }, []);


  const features = [
    {
      title: "Decentralized Storage",
      description: "Your content lives forever on Lighthouse & IPFS. Censorship-resistant, permanent, and user-owned.",
      icon: <Globe className="w-6 h-6 text-cyan-400" />,
      colSpan: 2 as const,
      content: (
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden h-64 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors w-full">
          <div className="absolute inset-0 bg-[url('https://beebom.com/wp-content/uploads/2021/11/Web-3.0-architecture.jpg?w=640')] bg-cover opacity-20 bg-center" />
          <div className="relative z-10 text-cyan-400 font-mono text-sm flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-cyan-500/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            storage://lighthouse_node_01
            <span className="text-xs text-slate-500 ml-2">| 100% Uptime</span>
          </div>
        </div>
      )
    },
    {
      title: "x402 Payments",
      description: "Programmable USDC streams on Base. Pay once, access forever. No subscription fatigue.",
      icon: <ShieldCheck className="w-6 h-6 text-indigo-400" />,
      colSpan: 1 as const,
    },
    {
      title: "Premium Player",
      description: "High-fidelity, token-gated streaming. Only verified subscribers can decrypt/watch.",
      icon: <Play className="w-6 h-6 text-purple-400" />,
      colSpan: 1 as const,
    },
    {
      title: "Creator Economy 2.0",
      description: "Keep 100% of your revenue. You own the platform. No middlemen fees on memberships.",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      colSpan: 2 as const,
      content: (
        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl font-black text-green-400 mb-1 relative z-10">100%</div>
            <div className="text-sm font-medium text-green-200/60 uppercase tracking-widest relative z-10">Revenue Share</div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center grayscale opacity-50 relative">
            <div className="text-4xl font-black text-white mb-1">0%</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Platform Fees</div>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="relative flex flex-col gap-32 pb-20 overflow-hidden font-sans">

      {/* Hero Section */}
      <Hero />

      {/* Revenue Comparison Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 w-full pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Stop Paying the <span className="text-red-500">Platform Tax</span>.</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Legacy platforms take up to 45% of your hard-earned revenue. On x402, you keep what you earn.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="font-semibold text-red-200">YouTube / Twitch</span>
                <span className="font-bold text-red-500">~55% Share</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
                <span className="font-semibold text-cyan-200">ContentHub x402</span>
                <span className="font-bold text-cyan-400">100% Share</span>
              </div>
            </div>
          </div>

          {/* Visual Chart */}
          <div className="h-[400px] rounded-3xl bg-slate-900/50 border border-white/5 relative overflow-hidden flex items-end justify-center gap-8 p-10">
            <div className="w-1/3 h-[55%] bg-red-500/20 rounded-t-xl border-t border-x border-red-500/30 relative group">
              <div className="absolute -top-10 left-0 right-0 text-center text-red-400 font-bold">Old Way</div>
            </div>
            <div className="w-1/3 h-full bg-cyan-500/20 rounded-t-xl border-t border-x border-cyan-500/30 relative group shadow-[0_0_50px_-10px_rgba(34,211,238,0.2)]">
              <div className="absolute -top-10 left-0 right-0 text-center text-cyan-400 font-bold">New Way</div>
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">How it Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Start earning in minutes, not months.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Connect Wallet", desc: "Sign in with your wallet. No email or password needed." },
            { step: "02", title: "Upload Content", desc: "Store your videos permanently on Lighthouse & IPFS." },
            { step: "03", title: "Earn Streams", desc: "Get paid instantly in USDC for every second streamed." }
          ].map((item, i) => (
            <div key={i} className="relative group p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-6 text-6xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors select-none">{item.step}</div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 rounded-full bg-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skiper UI Features Section */}
      <section className="relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Why x402?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Built on the bleeding edge of Web3 technology.</p>
        </div>
        <AppleStyleFeature features={features} />
      </section>

      {/* Featured Creators Section */}
      <div className="relative z-10">
        <FeaturedCreators />
      </div>

      {/* Skiper UI Showcase Section */}
      {showcaseProjects.length > 0 && (
        <section className="relative z-10 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
              Originals. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Only on x402.</span>
            </h2>
          </div>
          <ProjectsShowcase projects={showcaseProjects} />
        </section>
      )}

      {/* Call to Action */}
      <section className="relative w-full py-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="relative p-20 md:p-32 rounded-[3.5rem] bg-slate-900 border border-white/10 overflow-hidden group">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(100,50,255,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

            {/* Warp Speed Lines - CSS Trick */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
              <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-50 blur-[1px]" />
              <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-50 blur-[1px]" />
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-30 blur-[2px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-8xl font-serif text-white tracking-tight leading-[0.9] mb-4">
                  Ready to join <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 italic">the revolution?</span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light"
              >
                Start streaming, collecting, and earning today. <br /> The future of content is here.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Link
                  href="/explore"
                  className="relative group inline-flex items-center gap-4 px-12 py-6 rounded-full bg-white text-slate-950 font-bold text-xl transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.6)]"
                >
                  Launch App <Zap className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-slate-600 pb-10 text-sm">
        <p>© 2026 ContentHub. Decentralized & Unstoppable.</p>
      </footer>
    </div>
  );
}
