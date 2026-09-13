import { ConflictException } from '@nestjs/common';
import { AlternativaService } from './alternativa.service';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { PerguntaService } from "../pergunta/pergunta.service";
export declare class AlternativaController {
    private readonly alternativaService;
    private readonly perguntaService;
    constructor(alternativaService: AlternativaService, perguntaService: PerguntaService);
    create(createAlternativaDto: CreateAlternativaDto): Promise<ConflictException | {
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    } | null>;
    update(id: string, updateAlternativaDto: UpdateAlternativaDto): Promise<ConflictException | {
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
    remove(id: string): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
}
