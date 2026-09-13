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
exports.UpdateAlternativaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_alternativa_dto_1 = require("./create-alternativa.dto");
const class_validator_1 = require("class-validator");
class UpdateAlternativaDto extends (0, mapped_types_1.PartialType)(create_alternativa_dto_1.CreateAlternativaDto) {
    texto;
    perguntaId;
    correta;
}
exports.UpdateAlternativaDto = UpdateAlternativaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Texto não pode ser vazio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAlternativaDto.prototype, "texto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pergunta ID não pode ser vazia' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAlternativaDto.prototype, "perguntaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O número de jogadores não pode ser vazio!' }),
    (0, class_validator_1.IsBoolean)({ message: 'Deve ser verdadeiro ou falso!' }),
    __metadata("design:type", Boolean)
], UpdateAlternativaDto.prototype, "correta", void 0);
//# sourceMappingURL=update-alternativa.dto.js.map