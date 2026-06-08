"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { NewsItem } from "@/types/news";
import { HeroCard, GridCard } from "./NewsCard";

export function BentoGrid({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const [hero, ...rest] = items;

  return (
    <div>
      {/* Featured / hero story */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={hero.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ marginBottom: 22 }}
        >
          <HeroCard item={hero} />
        </motion.div>
      </AnimatePresence>

      {/* 3-column newspaper grid */}
      {rest.length > 0 && (
        <div className="news-grid">
          <AnimatePresence mode="popLayout">
            {rest.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
              >
                <GridCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
