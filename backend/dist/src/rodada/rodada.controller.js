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
exports.RodadaController = void 0;
const common_1 = require("@nestjs/common");
const rodada_service_1 = require("./rodada.service");
const create_rodada_dto_1 = require("./dto/create-rodada.dto");
const update_rodada_dto_1 = require("./dto/update-rodada.dto");
const pergunta_service_1 = require("../pergunta/pergunta.service");
const sala_service_1 = require("../sala/sala.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RodadaController = class RodadaController {
    rodadaService;
    perguntaService;
    salaService;
    constructor(rodadaService, perguntaService, salaService) {
        this.rodadaService = rodadaService;
        this.perguntaService = perguntaService;
        this.salaService = salaService;
    }
    async create(createRodadaDto) {
        const perguntaExiste = await this.perguntaService.findOne(createRodadaDto.perguntaId);
        const salaExiste = await this.salaService.findOne(createRodadaDto.salaId);
        if (!perguntaExiste) {
            return new common_1.ConflictException('Essa pergunta não existe!');
        }
        if (!salaExiste) {
            return new common_1.ConflictException('Essa sala não existe!');
        }
        return this.rodadaService.create(createRodadaDto);
    }
    ;
    async findAll() {
        return await this.rodadaService.findAll();
    }
    ;
    async update(id, updateRodadaDto) {
        const perguntaExiste = await this.perguntaService.findOne(updateRodadaDto.perguntaId);
        const salaExiste = await this.salaService.findOne(updateRodadaDto.salaId);
        if (!perguntaExiste) {
            return new common_1.ConflictException('Essa pergunta não existe!');
        }
        if (!salaExiste) {
            return new common_1.ConflictException('Essa sala não existe!');
        }
        return this.rodadaService.update(Number(id), updateRodadaDto);
    }
    ;
    async remove(id) {
        return this.rodadaService.remove(Number(id));
    }
    ;
};
exports.RodadaController = RodadaController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rodada_dto_1.CreateRodadaDto]),
    __metadata("design:returntype", Promise)
], RodadaController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RodadaController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_rodada_dto_1.UpdateRodadaDto]),
    __metadata("design:returntype", Promise)
], RodadaController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RodadaController.prototype, "remove", null);
exports.RodadaController = RodadaController = __decorate([
    (0, common_1.Controller)('rodada'),
    __metadata("design:paramtypes", [rodada_service_1.RodadaService,
        pergunta_service_1.PerguntaService,
        sala_service_1.SalaService])
], RodadaController);
//# sourceMappingURL=rodada.controller.js.map