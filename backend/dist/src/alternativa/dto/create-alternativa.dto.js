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
exports.CreateAlternativaDto = void 0;
const class_validator_1 = require("class-validator");
class CreateAlternativaDto {
    texto;
    perguntaId;
    correta;
}
exports.CreateAlternativaDto = CreateAlternativaDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Texto não pode ser vazio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlternativaDto.prototype, "texto", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Pergunta ID não pode ser vazia' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAlternativaDto.prototype, "perguntaId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'O número de jogadores não pode ser vazio!' }),
    (0, class_validator_1.IsBoolean)({ message: 'Deve ser verdadeiro ou falso!' }),
    __metadata("design:type", Boolean)
], CreateAlternativaDto.prototype, "correta", void 0);
//# sourceMappingURL=create-alternativa.dto.js.map