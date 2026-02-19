"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
    title: string;
    description: string;
    icon?: ReactNode;
    className?: string;
    children?: ReactNode;
    colSpan?: 1 | 2 | 3;
}

function FeatureCard({ title, description, icon, className, children, colSpan = 1 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-10 flex flex-col justify-between group transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_80px_-20px_rgba(34,211,238,0.2)] hover:bg-zinc-900/60",
                colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
                className
            )}
        >
            <div className="z-10 relative h-full flex flex-col items-start text-left w-full">
                <div className="mb-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/20 group-hover:shadow-cyan-500/20 group-hover:border-cyan-500/20">
                    {icon}
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tighter group-hover:text-cyan-50 transition-colors">{title}</h3>
                <p className="text-zinc-400 leading-relaxed font-light text-lg tracking-wide max-w-lg">{description}</p>

                {children && <div className="mt-8 relative z-0 flex-1 w-full">{children}</div>}
            </div>

            {/* God Level Effects */}
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-cyan-400/20 transition-all duration-1000 opacity-0 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
        </motion.div>
    );
}

export function AppleStyleFeature({
    features,
}: {
    features: {
        title: string;
        description: string;
        icon: ReactNode;
        colSpan?: 1 | 2;
        content?: ReactNode;
    }[];
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
            {features.map((feature, i) => (
                <FeatureCard
                    key={i}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    colSpan={feature.colSpan}
                >
                    {feature.content}
                </FeatureCard>
            ))}
        </div>
    );
}
