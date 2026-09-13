"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";

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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#080b18]/75 px-6 backdrop-blur-md"
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          {/* Brilhos do fundo */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[7rem]" />
            <div className="absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[5rem]" />
          </div>

          <motion.div
            initial={{ y: 14, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[290px] rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          >
            <div className="rounded-[1.35rem] border border-white/[0.06] bg-[#101426]/95 px-7 py-8 text-center">
              {/* Ícone animado */}
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 opacity-25 blur-xl"
                  animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 shadow-lg shadow-fuchsia-950/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Crown size={25} strokeWidth={2.4} className="text-white" />
                </motion.div>
                <motion.div
                  className="absolute -right-1 -top-1 text-orange-300"
                  animate={{ rotate: [0, 18, 0], scale: [0.85, 1.1, 0.85] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles size={16} fill="currentColor" />
                </motion.div>
              </div>

              <p className="text-base font-bold text-white">{message}</p>
              <p className="mt-1 text-xs text-slate-500">Aguarde um instante...</p>

              {/* Barra de progresso indeterminada */}
              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
