import { Injectable } from '@nestjs/common';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { ResultResponseApiModel } from './models/result-response-api.model';
import { PhaseComponentWinnerEntity } from '../../repository/phase-component-winner/phase-component-winner.entity';

@Injectable()
export class ResultService {
  constructor(
    private readonly winnerRepository: PhaseComponentWinnerRepository,
  ) {}

  private winnerEntityToResponseApiModel(
    entity: PhaseComponentWinnerEntity,
  ): ResultResponseApiModel {
    return {
      id: entity.id,
      wallet: entity.wallet,
      phaseId: entity.phase_id,
      allowlistId: entity.allowlist_id,
      phaseComponentId: entity.phase_component_id,
      amount: entity.amount,
    };
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<ResultResponseApiModel[]> {
    const entities = await this.winnerRepository.getByAllowlistId(allowlistId);
    return entities.map(this.winnerEntityToResponseApiModel);
  }

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<ResultResponseApiModel[]> {
    const entities = await this.winnerRepository.getByPhaseId(param);
    return entities.map(this.winnerEntityToResponseApiModel);
  }

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<ResultResponseApiModel[]> {
    const entities = await this.winnerRepository.getByPhaseComponentId(param);
    return entities.map(this.winnerEntityToResponseApiModel);
  }
}
