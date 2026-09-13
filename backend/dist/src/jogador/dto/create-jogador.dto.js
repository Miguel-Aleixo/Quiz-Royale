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
exports.CreateJogadorDto = void 0;
const class_validator_1 = require("class-validator");
class CreateJogadorDto {
    usuarioId;
    salaId;
    eliminado;
}
exports.CreateJogadorDto = CreateJogadorDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Usuário ID não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Usuário ID deve ser um número!' }),
    __metadata("design:type", Number)
], CreateJogadorDto.prototype, "usuarioId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Sala ID não pode ser vazio!' }),
    (0, class_validator_1.IsInt)({ message: 'Sala ID deve ser um número!' }),
    __metadata("design:type", Number)
], CreateJogadorDto.prototype, "salaId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Eliminado não pode ser vazio!' }),
    (0, class_validator_1.IsBoolean)({ message: 'Eliminado deve ser verdadeiro ou falso!' }),
    __metadata("design:type", Boolean)
], CreateJogadorDto.prototype, "eliminado", void 0);
//# sourceMappingURL=create-jogador.dto.js.map