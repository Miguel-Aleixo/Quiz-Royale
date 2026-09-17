"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface Patente {
  id: number;
  nome: string;
}

interface Token {
  sub: number;
}

export function useBuscarPatente(patenteId: number) {
  const API = process.env.NEXT_PUBLIC_API;

  const [patente, setPatente] = useState<Patente | null>(null);
  const [loadingPatente, setLoadingPatente] = useState(true);
  const [errorPatente, setErrorPatente] = useState<string | null>(null);

  useEffect(() => {
    async function buscar() {
      try {
        const token = Cookies.get("token");

        if (!token) {
          throw new Error("Token não encontrado");
        }

        const res = await fetch(`${API}/patente/${patenteId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Erro ao buscar patente");
        }

        const data = await res.json();

        setPatente(data);
      } catch (err) {
        setErrorPatente(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoadingPatente(false);
      }
    }

    buscar();
  }, [API]);

  return {
    patente,
    loadingPatente,
    errorPatente,
  };
}

