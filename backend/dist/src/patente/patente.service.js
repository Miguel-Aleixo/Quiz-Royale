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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatenteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatenteService = class PatenteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPatenteDto) {
        return await this.prisma.patente.create({
            data: createPatenteDto
        });
    }
    ;
    async findAll() {
        return await this.prisma.patente.findMany();
    }
    ;
    async findName(nome) {
        return await this.prisma.patente.findFirst({
            where: {
                nome: nome
            }
        });
    }
    ;
    async update(id, updatePatenteDto) {
        return await this.prisma.patente.update({
            where: {
                id: id
            },
            data: updatePatenteDto
        });
    }
    ;
    async remove(id) {
        const usuarios = await this.prisma.usuario.count({
            where: {
                patenteId: id,
            },
        });
        if (usuarios > 0) {
            throw new common_1.ConflictException(`Não é possível excluir esta patente. Existem ${usuarios} usuário(s) vinculados a ela.`);
        }
        return await this.prisma.patente.delete({
            where: {
                id,
            },
        });
    }
};
exports.PatenteService = PatenteService;
exports.PatenteService = PatenteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatenteService);
//# sourceMappingURL=patente.service.js.map