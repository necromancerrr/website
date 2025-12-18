"use client";

import { useState, useEffect } from "react";

export default function TypewriterText({ text }: { text: string }) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            setDisplayedText((prev) => {
                if (prev.length < text.length) {
                    return prev + text.charAt(prev.length);
                }
                return prev;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [text]);

    return (
        <span className="text-electric">
            {displayedText}
        </span>
    );
}
