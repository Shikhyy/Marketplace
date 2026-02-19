"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RollingTextProps {
    words: string[];
    interval?: number;
    className?: string;
}

export function RollingText({ words, interval = 3000, className = "" }: RollingTextProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, interval);
        return () => clearInterval(timer);
    }, [words.length, interval]);

    return (
        <div className={`relative inline-block h-[1.1em] overflow-hidden align-bottom ${className}`}>
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={index}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="block absolute top-0 left-0 w-full text-center"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
            {/* Invisible placeholder to maintain width */}
            <span className="invisible opacity-0">{words.reduce((a, b) => (a.length > b.length ? a : b))}</span>
        </div>
    );
}
