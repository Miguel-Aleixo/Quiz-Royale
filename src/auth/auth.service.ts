import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from 'src/usuario/usuario.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {

    const usuario = await this.usuarioService.findByEmail(email);

    if (!usuario) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha,
    );

    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      patenteId: usuario.patenteId,
      role: usuario.role
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
    };
  }
}