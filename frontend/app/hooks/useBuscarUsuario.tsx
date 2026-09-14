"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  patenteId: number;
  role: string;
}

interface Token {
  sub: number;
}

export function useBuscarUsuario() {
  const API = process.env.NEXT_PUBLIC_API;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function buscar() {
      try {
        const token = Cookies.get("token");

        if (!token) {
          throw new Error("Token não encontrado");
        }

        const decoded = jwtDecode<Token>(token);

        const res = await fetch(`${API}/usuario/${decoded.sub}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Erro ao buscar usuário");
        }

        const data = await res.json();

        setUsuario(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    buscar();
  }, [API]);

  return {
    usuario,
    loading,
    error,
  };
}

