"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RodadaModule = void 0;
const common_1 = require("@nestjs/common");
const rodada_service_1 = require("./rodada.service");
const rodada_controller_1 = require("./rodada.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const pergunta_module_1 = require("../pergunta/pergunta.module");
const sala_module_1 = require("../sala/sala.module");
let RodadaModule = class RodadaModule {
};
exports.RodadaModule = RodadaModule;
exports.RodadaModule = RodadaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, pergunta_module_1.PerguntaModule, sala_module_1.SalaModule],
        controllers: [rodada_controller_1.RodadaController],
        providers: [rodada_service_1.RodadaService],
    })
], RodadaModule);
//# sourceMappingURL=rodada.module.js.map