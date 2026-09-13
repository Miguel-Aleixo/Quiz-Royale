"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const usuario_module_1 = require("./usuario/usuario.module");
const patente_module_1 = require("./patente/patente.module");
const prisma_service_1 = require("./prisma/prisma.service");
const tema_module_1 = require("./tema/tema.module");
const pergunta_module_1 = require("./pergunta/pergunta.module");
const jogador_module_1 = require("./jogador/jogador.module");
const sala_module_1 = require("./sala/sala.module");
const rodada_module_1 = require("./rodada/rodada.module");
const alternativa_module_1 = require("./alternativa/alternativa.module");
const resposta_module_1 = require("./resposta/resposta.module");
const auth_module_1 = require("./auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            usuario_module_1.UsuarioModule,
            patente_module_1.PatenteModule,
            tema_module_1.TemaModule,
            pergunta_module_1.PerguntaModule,
            jogador_module_1.JogadorModule,
            sala_module_1.SalaModule,
            rodada_module_1.RodadaModule,
            alternativa_module_1.AlternativaModule,
            resposta_module_1.RespostaModule,
            auth_module_1.AuthModule,
        ],
        providers: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map