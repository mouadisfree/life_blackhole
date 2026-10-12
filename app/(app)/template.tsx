"use client";

import { motion } from "motion/react";

/** Each app page settles in slowly, like being pulled toward the horizon. */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex w-full flex-1 flex-col items-center"
      initial={{ opacity: 0, scale: 1.04, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
