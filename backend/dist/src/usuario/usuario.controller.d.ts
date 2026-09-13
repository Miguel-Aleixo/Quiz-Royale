import { ConflictException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsuarioController {
    private readonly usuarioService;
    constructor(usuarioService: UsuarioService);
    create(createUsuarioDto: CreateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    } | ConflictException>;
    createAdmin(createUsuarioDto: CreateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    } | ConflictException>;
    findAll(): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }[]>;
    update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    } | ConflictException>;
    remove(id: string): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }>;
}
