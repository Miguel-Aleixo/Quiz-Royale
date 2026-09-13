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
exports.AlternativaController = void 0;
const common_1 = require("@nestjs/common");
const alternativa_service_1 = require("./alternativa.service");
const create_alternativa_dto_1 = require("./dto/create-alternativa.dto");
const update_alternativa_dto_1 = require("./dto/update-alternativa.dto");
const pergunta_service_1 = require("../pergunta/pergunta.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AlternativaController = class AlternativaController {
    alternativaService;
    perguntaService;
    constructor(alternativaService, perguntaService) {
        this.alternativaService = alternativaService;
        this.perguntaService = perguntaService;
    }
    async create(createAlternativaDto) {
        const perguntaExiste = await this.perguntaService.findOne(createAlternativaDto.perguntaId);
        if (!perguntaExiste) {
            return new common_1.ConflictException('Essa pergunta não existe!');
        }
        return await this.alternativaService.create(createAlternativaDto);
    }
    async findAll() {
        return await this.alternativaService.findAll();
    }
    async findOne(id) {
        return await this.alternativaService.findOne(Number(id));
    }
    async update(id, updateAlternativaDto) {
        const perguntaExiste = await this.perguntaService.findOne(updateAlternativaDto.perguntaId);
        if (!perguntaExiste) {
            return new common_1.ConflictException('Essa pergunta não existe!');
        }
        return await this.alternativaService.update(Number(id), updateAlternativaDto);
    }
    async remove(id) {
        return await this.alternativaService.remove(Number(id));
    }
};
exports.AlternativaController = AlternativaController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_alternativa_dto_1.CreateAlternativaDto]),
    __metadata("design:returntype", Promise)
], AlternativaController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlternativaController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlternativaController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_alternativa_dto_1.UpdateAlternativaDto]),
    __metadata("design:returntype", Promise)
], AlternativaController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlternativaController.prototype, "remove", null);
exports.AlternativaController = AlternativaController = __decorate([
    (0, common_1.Controller)('alternativa'),
    __metadata("design:paramtypes", [alternativa_service_1.AlternativaService,
        pergunta_service_1.PerguntaService])
], AlternativaController);
//# sourceMappingURL=alternativa.controller.js.map