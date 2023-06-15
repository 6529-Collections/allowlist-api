import { BadRequestException, Injectable } from '@nestjs/common';
import { PhaseRepository } from '../../repository/phase/phase.repository';
import { PhaseResponseApiModel } from './model/phase-response-api.model';
import { PhaseEntity } from '../../repository/phase/phase.entity';

@Injectable()
export class PhaseService {
  constructor(private readonly phaseRepository: PhaseRepository) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseResponseApiModel[]> {
    const entities = await this.phaseRepository.getByAllowlistId(allowlistId);
    return entities.map(this.phaseEntityToResponseApiModel);
  }

  async getPhase(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseResponseApiModel> {
    const { allowlistId, phaseId } = param;
    const phase = await this.phaseRepository.getAllowlistPhase({
      allowlistId,
      phaseId,
    });
    if (!phase) {
      throw new BadRequestException('Phase not found');
    }
    return this.phaseEntityToResponseApiModel(phase);
  }

  private phaseEntityToResponseApiModel(
    entity: PhaseEntity,
  ): PhaseResponseApiModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      insertionOrder: entity.insertion_order,
      allowlistId: entity.allowlist_id,
      walletsCount: entity.wallets_count,
      tokensCount: entity.tokens_count,
    };
  }
}
