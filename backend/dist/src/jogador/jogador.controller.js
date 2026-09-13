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
exports.JogadorController = void 0;
const common_1 = require("@nestjs/common");
const jogador_service_1 = require("./jogador.service");
const create_jogador_dto_1 = require("./dto/create-jogador.dto");
const update_jogador_dto_1 = require("./dto/update-jogador.dto");
const usuario_service_1 = require("../usuario/usuario.service");
const sala_service_1 = require("../sala/sala.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let JogadorController = class JogadorController {
    jogadorService;
    usuarioService;
    salaService;
    constructor(jogadorService, usuarioService, salaService) {
        this.jogadorService = jogadorService;
        this.usuarioService = usuarioService;
        this.salaService = salaService;
    }
    async create(createJogadorDto) {
        const usuarioExiste = await this.usuarioService.findOne(createJogadorDto.usuarioId);
        const salaExiste = await this.salaService.findOne(createJogadorDto.salaId);
        if (!usuarioExiste) {
            return new common_1.ConflictException('Esse usuario não existe!');
        }
        if (!salaExiste) {
            return new common_1.ConflictException('Essa sala não existe!');
        }
        return this.jogadorService.create(createJogadorDto);
    }
    findAll() {
        return this.jogadorService.findAll();
    }
    findOne(id) {
        return this.jogadorService.findOne(Number(id));
    }
    async update(id, updateJogadorDto) {
        const usuarioExiste = await this.usuarioService.findOne(updateJogadorDto.usuarioId);
        const salaExiste = await this.salaService.findOne(updateJogadorDto.salaId);
        if (!usuarioExiste) {
            return new common_1.ConflictException('Esse usuario não existe!');
        }
        if (!salaExiste) {
            return new common_1.ConflictException('Essa sala não existe!');
        }
        return this.jogadorService.update(Number(id), updateJogadorDto);
    }
    async remove(id) {
        return this.jogadorService.remove(Number(id));
    }
};
exports.JogadorController = JogadorController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_jogador_dto_1.CreateJogadorDto]),
    __metadata("design:returntype", Promise)
], JogadorController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JogadorController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JogadorController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_jogador_dto_1.UpdateJogadorDto]),
    __metadata("design:returntype", Promise)
], JogadorController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JogadorController.prototype, "remove", null);
exports.JogadorController = JogadorController = __decorate([
    (0, common_1.Controller)('jogador'),
    __metadata("design:paramtypes", [jogador_service_1.JogadorService,
        usuario_service_1.UsuarioService,
        sala_service_1.SalaService])
], JogadorController);
//# sourceMappingURL=jogador.controller.js.map