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
exports.TemaController = void 0;
const common_1 = require("@nestjs/common");
const tema_service_1 = require("./tema.service");
const create_tema_dto_1 = require("./dto/create-tema.dto");
const update_tema_dto_1 = require("./dto/update-tema.dto");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorators_1 = require("../auth/decorators/roles.decorators");
let TemaController = class TemaController {
    temaService;
    constructor(temaService) {
        this.temaService = temaService;
    }
    async create(createTemaDto) {
        const temaExiste = await this.temaService.findName(createTemaDto.nome);
        if (temaExiste) {
            return new common_1.ConflictException('Essa patente já existe!');
        }
        ;
        return this.temaService.create(createTemaDto);
    }
    ;
    findAll() {
        return this.temaService.findAll();
    }
    ;
    async update(id, updateTemaDto) {
        const TemaExiste = await this.temaService.findName(updateTemaDto.nome);
        if (TemaExiste) {
            return new common_1.ConflictException('Esse tema já existe!');
        }
        ;
        return this.temaService.update(Number(id), updateTemaDto);
    }
    ;
    async remove(id) {
        return this.temaService.remove(Number(id));
    }
    ;
};
exports.TemaController = TemaController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorators_1.Roles)('ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tema_dto_1.CreateTemaDto]),
    __metadata("design:returntype", Promise)
], TemaController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorators_1.Roles)('ADMIN'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemaController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorators_1.Roles)('ADMIN'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tema_dto_1.UpdateTemaDto]),
    __metadata("design:returntype", Promise)
], TemaController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorators_1.Roles)('ADMIN'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemaController.prototype, "remove", null);
exports.TemaController = TemaController = __decorate([
    (0, common_1.Controller)('tema'),
    __metadata("design:paramtypes", [tema_service_1.TemaService])
], TemaController);
//# sourceMappingURL=tema.controller.js.map