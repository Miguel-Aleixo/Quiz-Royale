import { Test, TestingModule } from '@nestjs/testing';
import { RespostaService } from './resposta.service';

describe('RespostaService', () => {
  let service: RespostaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RespostaService],
    }).compile();

    service = module.get<RespostaService>(RespostaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
