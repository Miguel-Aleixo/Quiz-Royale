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
exports.UpdateRespostaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_resposta_dto_1 = require("./create-resposta.dto");
const class_validator_1 = require("class-validator");
class UpdateRespostaDto extends (0, mapped_types_1.PartialType)(create_resposta_dto_1.CreateRespostaDto) {
    JogadorId;
    alternativaId;
    tempoResposta;
}
exports.UpdateRespostaDto = UpdateRespostaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Jogador ID não pode ser vazia' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateRespostaDto.prototype, "JogadorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Alternativa ID não pode ser vazia' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateRespostaDto.prototype, "alternativaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O tempo da resposta não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Deve ser em segundos!' }),
    __metadata("design:type", Number)
], UpdateRespostaDto.prototype, "tempoResposta", void 0);
//# sourceMappingURL=update-resposta.dto.js.map