"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { NewsItem } from "@/types/news";
import { NewsCard } from "./NewsCard";

export function BentoGrid({ items }: { items: NewsItem[] }) {
  return (
    <section className="bento-grid">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const isHero = index === 0 && item.hypeScore > 78;
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
              className={isHero ? "hero-card" : undefined}
              style={{ minWidth: 0 }}
            >
              <NewsCard item={item} featured={isHero} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
