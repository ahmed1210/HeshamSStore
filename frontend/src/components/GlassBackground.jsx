"use client";

import { motion } from "framer-motion";

const shoeImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400",
  "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=400",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=400",
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=400",
];

export default function GlassBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.12),transparent_35%),linear-gradient(135deg,#050505,#111111)]" />

      {/* Falling shoes */}
      <div className="absolute inset-0 overflow-hidden">
        {shoeImages.map((img, index) => (
          <motion.img
            key={index}
            src={img}
            alt="floating shoe"
            initial={{
              y: -220,
              x: `${index * 20 + 4}%`,
              rotate: index % 2 === 0 ? -25 : 25,
              opacity: 0,
            }}
            animate={{
              y: ["-20%", "120%"],
              rotate: index % 2 === 0 ? [-25, 25, -20] : [25, -25, 20],
              opacity: [0, 0.16, 0.12, 0],
            }}
            transition={{
              duration: 12 + index * 2,
              repeat: Infinity,
              delay: index * 1.5,
              ease: "linear",
            }}
            className="absolute h-24 w-24 rounded-3xl object-cover blur-[1px] md:h-36 md:w-36"
          />
        ))}

        {[...Array(12)].map((_, index) => (
          <motion.div
            key={`circle-${index}`}
            initial={{
              y: -100,
              x: `${index * 9}%`,
              opacity: 0,
            }}
            animate={{
              y: ["-10%", "115%"],
              opacity: [0, 0.24, 0],
            }}
            transition={{
              duration: 8 + index,
              repeat: Infinity,
              delay: index * 0.7,
              ease: "linear",
            }}
            className="absolute h-3 w-3 rounded-full bg-yellow-400/40 blur-sm"
          />
        ))}
      </div>

      {/* Glass blur layer */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
    </div>
  );
}