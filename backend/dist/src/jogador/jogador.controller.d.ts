import { ConflictException } from '@nestjs/common';
import { JogadorService } from './jogador.service';
import { CreateJogadorDto } from './dto/create-jogador.dto';
import { UpdateJogadorDto } from './dto/update-jogador.dto';
import { UsuarioService } from "../usuario/usuario.service";
import { SalaService } from "../sala/sala.service";
export declare class JogadorController {
    private readonly jogadorService;
    private readonly usuarioService;
    private readonly salaService;
    constructor(jogadorService: JogadorService, usuarioService: UsuarioService, salaService: SalaService);
    create(createJogadorDto: CreateJogadorDto): Promise<ConflictException | {
        id: number;
        eliminado: boolean;
        usuarioId: number;
        salaId: number;
    }>;
    findAll(): Promise<{
        id: number;
        eliminado: boolean;
        usuarioId: number;
        salaId: number;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        eliminado: boolean;
        usuarioId: number;
        salaId: number;
    } | null>;
    update(id: string, updateJogadorDto: UpdateJogadorDto): Promise<ConflictException | {
        id: number;
        eliminado: boolean;
        usuarioId: number;
        salaId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        eliminado: boolean;
        usuarioId: number;
        salaId: number;
    }>;
}
