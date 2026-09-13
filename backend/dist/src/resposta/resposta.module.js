"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RespostaModule = void 0;
const common_1 = require("@nestjs/common");
const resposta_service_1 = require("./resposta.service");
const resposta_controller_1 = require("./resposta.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const alternativa_module_1 = require("../alternativa/alternativa.module");
const jogador_module_1 = require("../jogador/jogador.module");
let RespostaModule = class RespostaModule {
};
exports.RespostaModule = RespostaModule;
exports.RespostaModule = RespostaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, alternativa_module_1.AlternativaModule, jogador_module_1.JogadorModule],
        controllers: [resposta_controller_1.RespostaController],
        providers: [resposta_service_1.RespostaService],
    })
], RespostaModule);
//# sourceMappingURL=resposta.module.js.map