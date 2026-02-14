"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const funnyPhrases = [
  "Warming up the portal",
  "Summoning the code",
  "Asking the database nicely",
  "Bribing the servers",
  "Rolling the dice",
  "Polishing the invite",
  "Herding the electrons",
  "Consulting the oracle",
  "Waking up the hamsters",
  "Charging the flux capacitor",
  "Dusting off the welcome mat",
  "Tuning the invitation frequency",
  "Buttering up the cloud",
  "Negotiating with the pixels",
  "Shaking the magic 8-ball",
];

interface FunnyLoaderProps {
  size?: "sm" | "lg";
}

export function FunnyLoader({ size = "sm" }: FunnyLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(
    () => Math.floor(Math.random() * funnyPhrases.length)
  );

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setPhraseIndex((i) => {
        let next;
        do {
          next = Math.floor(Math.random() * funnyPhrases.length);
        } while (next === i);
        return next;
      });
    }, 2000);
    return () => clearInterval(phraseInterval);
  }, []);

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="relative h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={phraseIndex}
              className="text-xl font-semibold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {funnyPhrases[phraseIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-3 gap-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={phraseIndex}
          className="text-sm text-muted-foreground font-medium"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {funnyPhrases[phraseIndex]}
        </motion.span>
      </AnimatePresence>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
