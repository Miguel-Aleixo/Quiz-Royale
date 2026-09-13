"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemaModule = void 0;
const common_1 = require("@nestjs/common");
const tema_service_1 = require("./tema.service");
const tema_controller_1 = require("./tema.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let TemaModule = class TemaModule {
};
exports.TemaModule = TemaModule;
exports.TemaModule = TemaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [tema_controller_1.TemaController],
        providers: [tema_service_1.TemaService],
        exports: [tema_service_1.TemaService]
    })
], TemaModule);
//# sourceMappingURL=tema.module.js.map