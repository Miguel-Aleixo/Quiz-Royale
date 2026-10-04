import { Suspense } from "react";
import RedefinirSenhaForm from "./RedefinirSenhaForm";

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080812] text-white">
          <div className="text-sm text-white/50">
            Carregando...
          </div>
        </main>
      }
    >
      <RedefinirSenhaForm />
    </Suspense>
  );
}
