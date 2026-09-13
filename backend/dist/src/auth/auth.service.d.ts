import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from "../usuario/usuario.service";
export declare class AuthService {
    private readonly usuarioService;
    private readonly jwtService;
    constructor(usuarioService: UsuarioService, jwtService: JwtService);
    login(email: string, senha: string): Promise<{
        token: string;
    }>;
}
