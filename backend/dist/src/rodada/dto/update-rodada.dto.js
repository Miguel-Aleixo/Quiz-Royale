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
exports.UpdateRodadaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_rodada_dto_1 = require("./create-rodada.dto");
const class_validator_1 = require("class-validator");
class UpdateRodadaDto extends (0, mapped_types_1.PartialType)(create_rodada_dto_1.CreateRodadaDto) {
    perguntaId;
    salaId;
    tempoLimite;
}
exports.UpdateRodadaDto = UpdateRodadaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pergunta ID não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Pergunta ID deve ser um número!' }),
    __metadata("design:type", Number)
], UpdateRodadaDto.prototype, "perguntaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Sala ID não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Sala ID deve ser um número!' }),
    __metadata("design:type", Number)
], UpdateRodadaDto.prototype, "salaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O tempo limite não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Tempo limite deve ser um número!' }),
    (0, class_validator_1.Min)(10, { message: 'O tempo limite deve ter pelo menos 10 segundos.' }),
    (0, class_validator_1.Max)(120, { message: 'O tempo limite  não pode ter mais de 120 segundos.' }),
    __metadata("design:type", Number)
], UpdateRodadaDto.prototype, "tempoLimite", void 0);
//# sourceMappingURL=update-rodada.dto.js.map