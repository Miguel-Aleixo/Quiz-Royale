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
exports.UpdateSalaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_sala_dto_1 = require("./create-sala.dto");
const class_validator_1 = require("class-validator");
const enumSala_1 = require("./enumSala");
class UpdateSalaDto extends (0, mapped_types_1.PartialType)(create_sala_dto_1.CreateSalaDto) {
    nome;
    maxJogadores;
    status;
}
exports.UpdateSalaDto = UpdateSalaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome não pode ser vazio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalaDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O número de jogadores não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'O número de jogadores deve ser um número!' }),
    (0, class_validator_1.Min)(1, { message: 'A sala deve ter pelo menos 1 jogador.' }),
    (0, class_validator_1.Max)(50, { message: 'Uma sala não pode ter mais de 50 jogadores.' }),
    __metadata("design:type", Number)
], UpdateSalaDto.prototype, "maxJogadores", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Status não pode ser vazio!' }),
    (0, class_validator_1.IsEnum)(enumSala_1.StatusSala, {
        message: 'Status deve ser ABERTA, ANDAMENTO ou FECHADA',
    }),
    __metadata("design:type", String)
], UpdateSalaDto.prototype, "status", void 0);
//# sourceMappingURL=update-sala.dto.js.map