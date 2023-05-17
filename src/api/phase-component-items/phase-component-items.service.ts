import { BadRequestException, Injectable } from '@nestjs/common';
import { PhaseComponentItemsRepository } from '../../repositories/phase-component-items/phase-component-items.repository';
import { PhaseComponentItemResponseApiModel } from './models/phase-component-item-response-api.model';

@Injectable()
export class PhaseComponentItemsService {
  constructor(
    private readonly phaseComponentItemsRepository: PhaseComponentItemsRepository,
  ) {}

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<PhaseComponentItemResponseApiModel[]> {
    return this.phaseComponentItemsRepository.getByPhaseComponentId(param);
  }

  async getPhaseComponentItem(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
    phaseComponentItemId: string;
  }): Promise<PhaseComponentItemResponseApiModel> {
    const { allowlistId, phaseId, phaseComponentId, phaseComponentItemId } =
      param;
    const phaseComponentItem =
      this.phaseComponentItemsRepository.getAllowlistPhaseComponentItem({
        allowlistId,
        phaseId,
        phaseComponentId,
        phaseComponentItemId,
      });
    if (!phaseComponentItem) {
      throw new BadRequestException('Phase component item not found');
    }
    return phaseComponentItem;
  }
}
