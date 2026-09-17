"use client";

import { AnimatePresence, motion } from "framer-motion";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export default function LoadingOverlay({
  show,
  message = "Carregando...",
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080b18]/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Circunferência */}
            <div className="relative h-12 w-12">
              {/* Círculo base */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />

              {/* Parte animada */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* Texto */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-sm font-medium text-white/80"
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}