"use client";

import { usePathname } from "next/navigation";
import BackgroundMusic from "./BackgroundMusic";
import PartidaMusic from "./PartidaMusic";

export default function MusicController() {
  const pathname = usePathname();

  const estaNaPartida = pathname.startsWith("/sala/partida");

  if (estaNaPartida) {
    return <PartidaMusic />;
  }

  return <BackgroundMusic />;
}