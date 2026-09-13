"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RespostaController = void 0;
const common_1 = require("@nestjs/common");
const resposta_service_1 = require("./resposta.service");
const create_resposta_dto_1 = require("./dto/create-resposta.dto");
const update_resposta_dto_1 = require("./dto/update-resposta.dto");
const alternativa_service_1 = require("../alternativa/alternativa.service");
const jogador_service_1 = require("../jogador/jogador.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RespostaController = class RespostaController {
    respostaService;
    alternativaService;
    jogadorService;
    constructor(respostaService, alternativaService, jogadorService) {
        this.respostaService = respostaService;
        this.alternativaService = alternativaService;
        this.jogadorService = jogadorService;
    }
    async create(createRespostaDto) {
        const jogadorExiste = await this.jogadorService.findOne(createRespostaDto.jogadorId);
        const alternativaExiste = await this.alternativaService.findOne(createRespostaDto.alternativaId);
        if (!jogadorExiste) {
            return new common_1.ConflictException('Esse jogador não existe!');
        }
        if (!alternativaExiste) {
            return new common_1.ConflictException('Essa alternativa não existe!');
        }
        return this.respostaService.create(createRespostaDto);
    }
    ;
    async findAll() {
        return this.respostaService.findAll();
    }
    async findOne(id) {
        return this.respostaService.findOne(Number(id));
    }
    async update(id, updateRespostaDto) {
        const jogadorExiste = await this.jogadorService.findOne(updateRespostaDto.jogadorId);
        const alternativaExiste = await this.alternativaService.findOne(updateRespostaDto.alternativaId);
        if (!jogadorExiste) {
            return new common_1.ConflictException('Esse jogador não existe!');
        }
        if (!alternativaExiste) {
            return new common_1.ConflictException('Essa alternativa não existe!');
        }
        return this.respostaService.update(Number(id), updateRespostaDto);
    }
    async remove(id) {
        return this.respostaService.remove(Number(id));
    }
};
exports.RespostaController = RespostaController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resposta_dto_1.CreateRespostaDto]),
    __metadata("design:returntype", Promise)
], RespostaController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RespostaController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RespostaController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resposta_dto_1.UpdateRespostaDto]),
    __metadata("design:returntype", Promise)
], RespostaController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RespostaController.prototype, "remove", null);
exports.RespostaController = RespostaController = __decorate([
    (0, common_1.Controller)('resposta'),
    __metadata("design:paramtypes", [resposta_service_1.RespostaService,
        alternativa_service_1.AlternativaService,
        jogador_service_1.JogadorService])
], RespostaController);
//# sourceMappingURL=resposta.controller.js.map