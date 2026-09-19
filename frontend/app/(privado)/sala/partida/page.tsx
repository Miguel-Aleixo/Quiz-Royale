import { Suspense } from "react";
import PartidaContent from "./PartidaContent";

export default function PartidaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500" />

            <p className="text-sm text-white/60">
              Carregando partida...
            </p>
          </div>
        </main>
      }
    >
      <PartidaContent />
    </Suspense>
  );
}