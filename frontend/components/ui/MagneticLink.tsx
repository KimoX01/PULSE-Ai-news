"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface MagneticLinkProps {
  href: string;
  children: ReactNode;
}

export function MagneticLink({ href, children }: MagneticLinkProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 210, damping: 16, mass: 0.15 });
  const springY = useSpring(y, { stiffness: 210, damping: 16, mass: 0.15 });

  function onMove(event: React.MouseEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.2);
    y.set(dy * 0.25);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-flex">
      <Link
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition duration-300 hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
      >
        {children}
      </Link>
    </motion.div>
  );
}
