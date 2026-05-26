"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { NewsItem } from "@/types/news";
import { NewsCard } from "./NewsCard";

export function BentoGrid({ items }: { items: NewsItem[] }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          /* First card with a very high score gets a hero treatment — full width */
          const isHero = index === 0 && item.hypeScore > 78;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
              style={{
                gridColumn: isHero ? "span 3" : "span 1",
                minWidth: 0,
              }}
            >
              <NewsCard item={item} featured={isHero} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
