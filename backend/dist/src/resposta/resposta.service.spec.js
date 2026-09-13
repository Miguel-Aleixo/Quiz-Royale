"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const resposta_service_1 = require("./resposta.service");
describe('RespostaService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [resposta_service_1.RespostaService],
        }).compile();
        service = module.get(resposta_service_1.RespostaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=resposta.service.spec.js.map