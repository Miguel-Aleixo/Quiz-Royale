import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class UsuarioService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createUsuarioDto: CreateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }>;
    createAdmin(createUsuarioDto: CreateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }>;
    findAll(): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }[]>;
    findByEmail(email: string): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    } | null>;
    findOne(id: number): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    } | null>;
    update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }>;
    remove(id: number): Promise<{
        nome: string;
        email: string;
        senha: string;
        role: import("@prisma/client").$Enums.Role;
        id: number;
        patenteId: number;
    }>;
}
