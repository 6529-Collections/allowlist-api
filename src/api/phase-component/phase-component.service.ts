import { BadRequestException, Injectable } from '@nestjs/common';
import { PhaseComponentRepository } from '../../repository/phase-components/phase-component.repository';
import { PhaseComponentResponseApiModel } from './model/phase-component-response-api.model';
import { PhaseComponentEntity } from '../../repository/phase-components/phase-component.entity';

@Injectable()
export class PhaseComponentService {
  constructor(
    private readonly phaseComponentRepository: PhaseComponentRepository,
  ) {}

  async getByAllowlistId(allowlistId: string) {
    const entities = await this.phaseComponentRepository.getByAllowlistId(
      allowlistId,
    );
    return entities.map(this.phaseComponentEntityToResponseApiModel);
  }

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseComponentResponseApiModel[]> {
    const entities = await this.phaseComponentRepository.getByPhaseId(param);
    return entities.map(this.phaseComponentEntityToResponseApiModel);
  }

  async getPhaseComponent(param: {
    allowlistId: string;
    phaseId: string;
    componentId: string;
  }): Promise<PhaseComponentResponseApiModel> {
    const { allowlistId, phaseId, componentId } = param;
    const phaseComponent =
      await this.phaseComponentRepository.getAllowlistPhaseComponent({
        allowlistId,
        phaseId,
        componentId,
      });
    if (!phaseComponent) {
      throw new BadRequestException('Phase component not found');
    }
    return this.phaseComponentEntityToResponseApiModel(phaseComponent);
  }

  private phaseComponentEntityToResponseApiModel(
    entity: PhaseComponentEntity,
  ): PhaseComponentResponseApiModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      insertionOrder: entity.insertion_order,
      allowlistId: entity.allowlist_id,
      phaseId: entity.phase_id,
      walletsCount: entity.wallets_count,
      tokensCount: entity.tokens_count,
    };
  }
}
