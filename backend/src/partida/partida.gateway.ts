import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { Server, Socket } from 'socket.io';

import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { UsuarioService } from '../usuario/usuario.service';

interface RodadaState {
  rodadaAtual: number;
  timer: NodeJS.Timeout | null;
  encerrando: boolean;
}

interface PerguntaSocket {
  rodada: any;
  numeroRodada: number;
  totalRodadas: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PartidaGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarioService: UsuarioService,
  ) {}

  /*
   * =========================================================
   * CONTROLE DAS PARTIDAS
   * =========================================================
   */

  private partidas = new Map<string, RodadaState>();

  /*
   * =========================================================
   * AUTENTICAÇÃO DO SOCKET
   * =========================================================
   */

  handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.emit('erro_partida', {
          mensagem: 'Token não informado.',
        });

        socket.disconnect();

        return;
      }

      const tokenLimpo = token.replace('Bearer ', '');

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new UnauthorizedException(
          'JWT_SECRET não configurado.',
        );
      }

      const decoded = jwt.verify(
        tokenLimpo,
        secret,
      );

      if (
        typeof decoded === 'string' ||
        !decoded.sub
      ) {
        throw new UnauthorizedException(
          'Token inválido.',
        );
      }

      socket.data.usuarioId = Number(decoded.sub);

      console.log(
        `Socket autenticado - Usuario: ${socket.data.usuarioId}`,
      );
    } catch (error) {
      console.error(
        'Erro na autenticação do Socket:',
        error,
      );

      socket.emit('erro_partida', {
        mensagem: 'Sessão inválida ou expirada.',
      });

      socket.disconnect();
    }
  }

  /*
   * =========================================================
   * ENTRAR NA PARTIDA
   * =========================================================
   */

  @SubscribeMessage('entrar_partida')
  async entrarPartida(
    @MessageBody()
    data: {
      codigo: string;
    },

    @ConnectedSocket()
    socket: Socket,
  ) {
    try {
      const usuarioId = socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      if (!data?.codigo) {
        throw new BadRequestException(
          'Código da sala não informado.',
        );
      }

      const codigo = data.codigo.toUpperCase();

      const sala =
        await this.prisma.sala.findUnique({
          where: {
            codigo,
          },

          include: {
            jogadores: true,

            rodadas: {
              orderBy: {
                ordem: 'asc',
              },

              include: {
                pergunta: {
                  select: {
                    id: true,
                    enunciado: true,

                    alternativas: {
                      select: {
                        id: true,
                        texto: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!sala) {
        throw new BadRequestException(
          'Sala não encontrada.',
        );
      }

      if (sala.status !== 'ANDAMENTO') {
        throw new BadRequestException(
          'A partida ainda não foi iniciada.',
        );
      }

      if (sala.rodadas.length === 0) {
        throw new BadRequestException(
          'Essa partida não possui rodadas.',
        );
      }

      const jogador =
        await this.prisma.jogador.findFirst({
          where: {
            usuarioId,
            salaId: sala.id,
          },
        });

      if (!jogador) {
        throw new BadRequestException(
          'Você não está participando dessa sala.',
        );
      }

      /*
       * Se o jogador já foi eliminado,
       * ele pode reconectar no socket,
       * mas não recebe mais perguntas.
       */

      socket.join(`partida:${codigo}`);

      if (jogador.eliminado) {
        socket.emit('jogador_eliminado', {
          mensagem:
            'Você foi eliminado e não participa mais das rodadas.',
        });

        return;
      }

      /*
       * Verificar estado da partida.
       */

      let estado = this.partidas.get(codigo);

      /*
       * Primeira conexão da partida.
       */

      if (!estado) {
        estado = {
          rodadaAtual: 0,
          timer: null,
          encerrando: false,
        };

        this.partidas.set(
          codigo,
          estado,
        );

        await this.iniciarRodada(
          codigo,
          sala.rodadas,
        );

        return;
      }

      /*
       * Partida já começou.
       * Enviar a rodada atual somente
       * para esse jogador.
       */

      const rodadaAtual =
        sala.rodadas[
          estado.rodadaAtual
        ];

      if (!rodadaAtual) {
        throw new BadRequestException(
          'Rodada atual não encontrada.',
        );
      }

      socket.emit(
        'pergunta',
        {
          rodada: rodadaAtual,
          numeroRodada:
            estado.rodadaAtual + 1,
          totalRodadas:
            sala.rodadas.length,
        } satisfies PerguntaSocket,
      );

      console.log(
        `Jogador ${jogador.id} entrou na partida ${codigo} na rodada ${
          estado.rodadaAtual + 1
        }`,
      );
    } catch (error) {
      socket.emit('erro_partida', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Erro ao entrar na partida.',
      });
    }
  }

  /*
   * =========================================================
   * INICIAR RODADA
   * =========================================================
   */

  private async iniciarRodada(
    codigo: string,
    rodadas: any[],
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    const rodada =
      rodadas[
        estado.rodadaAtual
      ];

    if (!rodada) {
      return;
    }

    /*
     * Limpar timer anterior.
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );
    }

    estado.encerrando = false;

    /*
     * Buscar sala.
     */

    const sala =
      await this.prisma.sala.findUnique({
        where: {
          codigo,
        },
      });

    if (!sala) {
      return;
    }

    /*
     * Buscar somente jogadores ativos.
     */

    const jogadoresAtivos =
      await this.prisma.jogador.findMany({
        where: {
          salaId: sala.id,
          eliminado: false,
        },

        select: {
          usuarioId: true,
        },
      });

    const usuariosAtivos =
      new Set(
        jogadoresAtivos.map(
          (jogador) =>
            jogador.usuarioId,
        ),
      );

    /*
     * Buscar sockets conectados na partida.
     */

    const sockets =
      await this.server
        .in(`partida:${codigo}`)
        .fetchSockets();

    /*
     * Enviar pergunta somente
     * para jogadores ativos.
     */

    for (const socket of sockets) {
      const usuarioId =
        Number(socket.data.usuarioId);

      if (
        usuariosAtivos.has(usuarioId)
      ) {
        socket.emit(
          'pergunta',
          {
            rodada,
            numeroRodada:
              estado.rodadaAtual + 1,
            totalRodadas:
              rodadas.length,
          } satisfies PerguntaSocket,
        );
      }
    }

    console.log(
      `Partida ${codigo} iniciou a rodada ${
        estado.rodadaAtual + 1
      }`,
    );

    /*
     * Timer da rodada.
     */

    estado.timer =
      setTimeout(
        async () => {
          try {
            await this.encerrarRodada(
              codigo,
              rodadas,
            );
          } catch (error) {
            console.error(
              'Erro ao encerrar rodada pelo timer:',
              error,
            );
          }
        },
        rodada.tempoLimite * 1000,
      );
  }

  /*
   * =========================================================
   * RESPONDER PERGUNTA
   * =========================================================
   */

  @SubscribeMessage('responder')
  async responder(
    @MessageBody()
    data: {
      codigo: string;
      alternativaId: number;
      rodadaId: number;
      tempoResposta: number;
    },

    @ConnectedSocket()
    socket: Socket,
  ) {
    try {
      const usuarioId =
        socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      if (!data?.codigo) {
        throw new BadRequestException(
          'Código da sala não informado.',
        );
      }

      if (!data.alternativaId) {
        throw new BadRequestException(
          'Alternativa não informada.',
        );
      }

      if (!data.rodadaId) {
        throw new BadRequestException(
          'Rodada não informada.',
        );
      }

      const codigo =
        data.codigo.toUpperCase();

      /*
       * Estado da partida.
       */

      const estado =
        this.partidas.get(codigo);

      if (!estado) {
        throw new BadRequestException(
          'A partida não está em andamento.',
        );
      }

      /*
       * Buscar sala.
       */

      const sala =
        await this.prisma.sala.findUnique({
          where: {
            codigo,
          },
        });

      if (!sala) {
        throw new BadRequestException(
          'Sala não encontrada.',
        );
      }

      /*
       * Buscar jogador.
       */

      const jogador =
        await this.prisma.jogador.findFirst({
          where: {
            usuarioId,
            salaId: sala.id,
          },
        });

      if (!jogador) {
        throw new BadRequestException(
          'Você não está participando dessa sala.',
        );
      }

      /*
       * Jogador eliminado não pode responder.
       */

      if (jogador.eliminado) {
        socket.emit(
          'jogador_eliminado',
          {
            mensagem:
              'Você foi eliminado e não pode mais responder.',
          },
        );

        return;
      }

      /*
       * Buscar rodada.
       */

      const rodada =
        await this.prisma.rodada.findUnique({
          where: {
            id: data.rodadaId,
          },
        });

      if (!rodada) {
        throw new BadRequestException(
          'Rodada não encontrada.',
        );
      }

      /*
       * Verificar se a rodada pertence
       * à sala.
       */

      if (
        rodada.salaId !==
        sala.id
      ) {
        throw new BadRequestException(
          'Essa rodada não pertence a essa sala.',
        );
      }

      /*
       * Verificar rodada atual.
       */

      const rodadaAtual =
        await this.prisma.rodada.findFirst({
          where: {
            salaId: sala.id,
          },

          orderBy: {
            ordem: 'asc',
          },

          skip:
            estado.rodadaAtual,
        });

      if (
        !rodadaAtual ||
        rodadaAtual.id !==
          rodada.id
      ) {
        throw new BadRequestException(
          'Essa não é a rodada atual.',
        );
      }

      /*
       * Buscar alternativa.
       */

      const alternativa =
        await this.prisma.alternativa.findUnique({
          where: {
            id: data.alternativaId,
          },
        });

      if (!alternativa) {
        throw new BadRequestException(
          'Alternativa não encontrada.',
        );
      }

      /*
       * Verificar se alternativa pertence
       * à pergunta.
       */

      if (
        alternativa.perguntaId !==
        rodada.perguntaId
      ) {
        throw new BadRequestException(
          'Essa alternativa não pertence à pergunta atual.',
        );
      }

      /*
       * Verificar se já respondeu.
       */

      const respostaExistente =
        await this.prisma.resposta.findFirst({
          where: {
            jogadorId:
              jogador.id,

            alternativa: {
              perguntaId:
                rodada.perguntaId,
            },
          },
        });

      if (respostaExistente) {
        throw new BadRequestException(
          'Você já respondeu essa pergunta.',
        );
      }

      /*
       * Registrar resposta.
       */

      const resposta =
        await this.prisma.resposta.create({
          data: {
            jogadorId:
              jogador.id,

            alternativaId:
              data.alternativaId,

            tempoResposta:
              data.tempoResposta,
          },

          include: {
            alternativa: {
              select: {
                id: true,
                correta: true,
              },
            },
          },
        });

      const correta =
        resposta.alternativa.correta;

      /*
       * =====================================================
       * RESULTADO DA RESPOSTA
       * =====================================================
       *
       * Acertou:
       * continua na partida.
       *
       * Errou:
       * é eliminado.
       *
       * NÃO existe pontuação aqui.
       *
       */

      if (!correta) {
        await this.prisma.jogador.update({
          where: {
            id: jogador.id,
          },

          data: {
            eliminado: true,
          },
        });

        socket.emit(
          'jogador_eliminado',
          {
            mensagem:
              'Você errou a pergunta e foi eliminado!',
          },
        );

        console.log(
          `Jogador ${jogador.id} foi eliminado na rodada ${rodada.id}.`,
        );
      } else {
        console.log(
          `Jogador ${jogador.id} acertou a rodada ${rodada.id}.`,
        );
      }

      /*
       * Resultado somente para
       * quem respondeu.
       */

      socket.emit(
        'resultado_resposta',
        {
          correta,
          alternativaId:
            data.alternativaId,
          rodadaId:
            data.rodadaId,
        },
      );

      /*
       * Verificar se a rodada acabou.
       */

      await this.verificarFimRodada(
        codigo,
        sala.id,
        rodada.id,
      );
    } catch (error) {
      socket.emit(
        'erro_resposta',
        {
          mensagem:
            error instanceof Error
              ? error.message
              : 'Erro ao registrar resposta.',
        },
      );
    }
  }

  /*
   * =========================================================
   * VERIFICAR FIM DA RODADA
   * =========================================================
   */

  private async verificarFimRodada(
    codigo: string,
    salaId: number,
    rodadaId: number,
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    if (estado.encerrando) {
      return;
    }

    /*
     * Somente jogadores ativos contam.
     */

    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,
          eliminado: false,
        },

        select: {
          id: true,
        },
      });

    /*
     * Se ninguém está mais ativo,
     * encerra a partida.
     */

    if (jogadores.length === 0) {
      await this.encerrarRodada(
        codigo,
      );

      return;
    }

    /*
     * Buscar respostas da rodada
     * somente dos jogadores ativos.
     */

    const respostas =
      await this.prisma.resposta.findMany({
        where: {
          jogadorId: {
            in: jogadores.map(
              (jogador) =>
                jogador.id,
            ),
          },

          alternativa: {
            pergunta: {
              rodadas: {
                some: {
                  id: rodadaId,
                },
              },
            },
          },
        },

        select: {
          jogadorId: true,
        },
      });

    const jogadoresQueResponderam =
      new Set(
        respostas.map(
          (resposta) =>
            resposta.jogadorId,
        ),
      );

    console.log(
      `Rodada ${rodadaId}: ${jogadoresQueResponderam.size}/${jogadores.length} jogadores ativos responderam.`,
    );

    /*
     * Todos os jogadores ativos responderam.
     */

    if (
      jogadoresQueResponderam.size >=
      jogadores.length
    ) {
      await this.encerrarRodada(
        codigo,
      );
    }
  }

  /*
   * =========================================================
   * CALCULAR PONTOS DA COLOCAÇÃO
   * =========================================================
   */

  private calcularPontosPosicao(
    posicao: number,
  ): number {
    const pontos: Record<
      number,
      number
    > = {
      1: 100,
      2: 75,
      3: 50,
      4: 35,
      5: 25,
      6: 20,
      7: 15,
      8: 10,
      9: 5,
    };

    return pontos[posicao] ?? 2;
  }

  /*
   * =========================================================
   * FINALIZAR PARTIDA
   * =========================================================
   */

  private async finalizarPartida(
    codigo: string,
    salaId: number,
  ) {
    /*
     * Buscar jogadores.
     */

    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,
        },

        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              pontuacao: true,
            },
          },
        },
      });

    /*
     * Jogadores que ainda estão ativos
     * ficam nas primeiras posições.
     *
     * Entre os eliminados, usamos a ordem
     * em que foram eliminados através
     * de posicaoFinal.
     */

    const jogadoresOrdenados =
      [...jogadores].sort(
        (a, b) => {
          /*
           * Ativo vem antes de eliminado.
           */

          if (
            a.eliminado !==
            b.eliminado
          ) {
            return a.eliminado
              ? 1
              : -1;
          }

          /*
           * Se ambos possuem posição final,
           * menor número = melhor colocação.
           */

          if (
            a.posicaoFinal != null &&
            b.posicaoFinal != null
          ) {
            return (
              a.posicaoFinal -
              b.posicaoFinal
            );
          }

          /*
           * Desempate pelo ID.
           */

          return a.id - b.id;
        },
      );

    /*
     * Se ainda não houver posição final
     * definida, atribuir pela ordem atual.
     */

    for (
      let index = 0;
      index <
      jogadoresOrdenados.length;
      index++
    ) {
      const jogador =
        jogadoresOrdenados[index];

      const posicao =
        index + 1;

      if (
        jogador.posicaoFinal !==
        posicao
      ) {
        await this.prisma.jogador.update({
          where: {
            id: jogador.id,
          },

          data: {
            posicaoFinal:
              posicao,
          },
        });

        jogador.posicaoFinal =
          posicao;
      }
    }

    /*
     * Ordenar definitivamente
     * pela posição.
     */

    jogadoresOrdenados.sort(
      (a, b) =>
        (a.posicaoFinal ?? 999999) -
        (b.posicaoFinal ?? 999999),
    );

    /*
     * =====================================================
     * DISTRIBUIR PONTOS
     * =====================================================
     */

    const ranking = [];

    for (
      let index = 0;
      index <
      jogadoresOrdenados.length;
      index++
    ) {
      const jogador =
        jogadoresOrdenados[index];

      const posicao =
        index + 1;

      const pontosGanhos =
        this.calcularPontosPosicao(
          posicao,
        );

      /*
       * Adicionar os pontos da colocação
       * ao ranking permanente.
       */

      const usuarioAtualizado =
        await this.prisma.usuario.update({
          where: {
            id: jogador.usuario.id,
          },

          data: {
            pontuacao: {
              increment:
                pontosGanhos,
            },
          },

          select: {
            id: true,
            nome: true,
            pontuacao: true,
            patenteId: true,
          },
        });

      /*
       * Recalcular patente.
       */

      const novaPatente =
        await this.prisma.patente.findFirst({
          where: {
            pontos: {
              lte:
                usuarioAtualizado.pontuacao,
            },
          },

          orderBy: {
            pontos: 'desc',
          },
        });

      if (
        novaPatente &&
        novaPatente.id !==
          usuarioAtualizado.patenteId
      ) {
        await this.prisma.usuario.update({
          where: {
            id: usuarioAtualizado.id,
          },

          data: {
            patenteId:
              novaPatente.id,
          },
        });

        console.log(
          `Usuário ${usuarioAtualizado.nome} subiu para a patente ${novaPatente.nome}!`,
        );
      }

      ranking.push({
        posicao,
        jogadorId: jogador.id,
        usuarioId: jogador.usuario.id,
        nome: jogador.usuario.nome,
        pontosGanhos,
        pontuacao:
          usuarioAtualizado.pontuacao,
        eliminado:
          jogador.eliminado,
      });
    }

    /*
     * Exibir ranking no servidor.
     */

    console.log(
      `Ranking final da partida ${codigo}:`,
      ranking,
    );

    /*
     * Atualizar sala.
     */

    await this.prisma.sala.update({
      where: {
        id: salaId,
      },

      data: {
        status: 'FINALIZADA',
      },
    });

    /*
     * Enviar ranking para todos.
     */

    this.server
      .to(`partida:${codigo}`)
      .emit(
        'partida_finalizada',
        {
          codigo,
          ranking,
        },
      );

    /*
     * Limpar partida.
     */

    this.partidas.delete(
      codigo,
    );
  }

  /*
   * =========================================================
   * ENCERRAR RODADA
   * =========================================================
   */

  private async encerrarRodada(
    codigo: string,
    rodadasExternas?: any[],
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    /*
     * Impedir duas execuções simultâneas.
     */

    if (estado.encerrando) {
      return;
    }

    estado.encerrando = true;

    /*
     * Limpar timer.
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );

      estado.timer = null;
    }

    /*
     * Buscar sala novamente.
     */

    const sala =
      await this.prisma.sala.findUnique({
        where: {
          codigo,
        },

        include: {
          rodadas: {
            orderBy: {
              ordem: 'asc',
            },

            include: {
              pergunta: {
                select: {
                  id: true,
                  enunciado: true,

                  alternativas: {
                    select: {
                      id: true,
                      texto: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!sala) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    const rodadas =
      sala.rodadas;

    if (rodadas.length === 0) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * =====================================================
     * ÚLTIMA RODADA
     * =====================================================
     */

    if (
      estado.rodadaAtual >=
      rodadas.length - 1
    ) {
      console.log(
        `Partida ${codigo} finalizada.`,
      );

      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    /*
     * =====================================================
     * VERIFICAR SE SOBROU APENAS UM
     * =====================================================
     */

    const jogadoresAtivos =
      await this.prisma.jogador.findMany({
        where: {
          salaId: sala.id,
          eliminado: false,
        },

        select: {
          id: true,
        },
      });

    /*
     * Se sobrou apenas um jogador,
     * ele é o campeão.
     *
     * Como ainda existem rodadas,
     * precisamos finalizar imediatamente.
     */

    if (
      jogadoresAtivos.length === 1
    ) {
      console.log(
        `Jogador ${jogadoresAtivos[0].id} venceu a partida ${codigo}.`,
      );

      /*
       * O único jogador ativo recebe
       * a posição 1.
       */

      await this.prisma.jogador.update({
        where: {
          id: jogadoresAtivos[0].id,
        },

        data: {
          posicaoFinal: 1,
        },
      });

      /*
       * Os jogadores eliminados ainda não
       * possuem posição definida.
       *
       * Eles receberão suas posições na
       * finalização.
       */

      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    /*
     * =====================================================
     * PRÓXIMA RODADA
     * =====================================================
     */

    estado.rodadaAtual++;

    estado.encerrando = false;

    const proximaRodada =
      rodadas[
        estado.rodadaAtual
      ];

    if (!proximaRodada) {
      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    console.log(
      `Partida ${codigo} avançando para a rodada ${
        estado.rodadaAtual + 1
      }`,
    );

    /*
     * Esperar 2 segundos para o frontend
     * mostrar o resultado.
     */

    setTimeout(
      async () => {
        try {
          await this.iniciarRodada(
            codigo,
            rodadas,
          );
        } catch (error) {
          console.error(
            'Erro ao iniciar próxima rodada:',
            error,
          );
        }
      },
      2000,
    );
  }
}