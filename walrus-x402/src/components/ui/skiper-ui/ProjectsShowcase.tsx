"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    title: string;
    category: string;
    description: string;
    image: string;
}

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
    const [activeId, setActiveId] = useState(projects[0].id);
    const activeProject = projects.find((p) => p.id === activeId) || projects[0];

    return (
        <div className="max-w-7xl mx-auto px-4 h-[600px] flex gap-6">
            {/* Preview Area */}
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-zinc-950 border border-white/5 shadow-2xl">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeProject.id}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={activeProject.image}
                            alt={activeProject.title}
                            fill
                            className="object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-0 left-0 p-10 z-10 w-full">
                    <motion.div
                        key={`text-${activeProject.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-xs font-medium text-white mb-4 inline-block backdrop-blur-md">
                            {activeProject.category}
                        </span>
                        <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{activeProject.title}</h3>
                        <p className="text-zinc-300 max-w-lg text-lg line-clamp-2">{activeProject.description}</p>
                    </motion.div>
                </div>
            </div>

            {/* List Area */}
            <div className="w-80 flex flex-col gap-2 py-4">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        onClick={() => setActiveId(project.id)}
                        className={cn(
                            "text-left p-6 rounded-3xl transition-all duration-300 group relative overflow-hidden",
                            activeId === project.id
                                ? "bg-zinc-800 text-white shadow-lg"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                        )}
                    >
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-lg font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                                {project.title}
                                {activeId === project.id && <ArrowUpRight className="w-4 h-4 opacity-50" />}
                            </span>
                            <span className="text-xs font-medium opacity-60 uppercase tracking-wider">{project.category}</span>
                        </div>

                        {activeId === project.id && (
                            <motion.div
                                layoutId="active-bg"
                                className="absolute inset-0 bg-zinc-800 -z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
