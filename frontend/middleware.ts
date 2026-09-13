import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================
  // TOKEN
  // ==========================================

  const token = request.cookies.get("token")?.value;

  // ==========================================
  // ROTAS PÚBLICAS
  // ==========================================

  const rotasPublicas = [
    "/",
    "/login",
    "/cadastro",
  ];

  const isRotaPublica = rotasPublicas.some(
    (rota) =>
      pathname === rota ||
      pathname.startsWith(`${rota}/`)
  );

  // ==========================================
  // SE FOR PÚBLICA
  // ==========================================

  if (isRotaPublica) {
    // Login e cadastro
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/cadastro")
    ) {
      // Se já estiver logado
      if (token) {
        try {
          const payload = getPayload(token);

          // ADMIN
          if (payload.role === "ADMIN") {
            return NextResponse.redirect(
              new URL("/dashboard", request.url)
            );
          }

          // JOGADOR
          return NextResponse.redirect(
            new URL("/perfil", request.url)
          );
        } catch {
          // Token inválido
          return NextResponse.next();
        }
      }
    }

    return NextResponse.next();
  }

  // ==========================================
  // TODAS AS ROTAS ABAIXO PRECISAM DE LOGIN
  // ==========================================

  if (!token) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    // Guarda a página que o usuário tentou acessar
    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  // ==========================================
  // DECODIFICAR JWT
  // ==========================================

  let payload;

  try {
    payload = getPayload(token);
  } catch {
    return NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
  }

  // ==========================================
  // DASHBOARD
  // SOMENTE ADMIN
  // ==========================================

  if (pathname.startsWith("/dashboard")) {
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/perfil", request.url)
      );
    }

    return NextResponse.next();
  }

  // ==========================================
  // PÁGINAS DO JOGADOR
  // ==========================================

  const rotasJogador = [
    "/perfil",
    "/partida",
  ];

  const isRotaJogador = rotasJogador.some(
    (rota) =>
      pathname === rota ||
      pathname.startsWith(`${rota}/`)
  );

  if (isRotaJogador) {
    // ADMIN não precisa acessar área de jogador
    if (payload.role === "ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  // ==========================================
  // OUTRAS ROTAS PRIVADAS
  // ==========================================

  return NextResponse.next();
}

// ==========================================
// FUNÇÃO PARA LER O JWT
// ==========================================

function getPayload(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Token inválido");
  }

  const payload = JSON.parse(
    Buffer.from(
      parts[1],
      "base64"
    ).toString("utf-8")
  );

  return payload;
}

// ==========================================
// CONFIGURAÇÃO
// ==========================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};