import { BadRequestException, Injectable } from '@nestjs/common';
import { PhaseComponentItemRepository } from '../../repository/phase-component-item/phase-component-item.repository';
import { PhaseComponentItemResponseApiModel } from './model/phase-component-item-response-api.model';
import { PhaseComponentItemEntity } from '../../repository/phase-component-item/phase-component-item.entity';
import { Pool } from '@6529-collections/allowlist-lib/app-types';

@Injectable()
export class PhaseComponentItemService {
  constructor(
    private readonly phaseComponentItemRepository: PhaseComponentItemRepository,
  ) {}

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<PhaseComponentItemResponseApiModel[]> {
    const entities =
      await this.phaseComponentItemRepository.getByPhaseComponentId(param);
    return entities.map(this.phaseComponentItemEntityToResponseApiModel);
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseComponentItemResponseApiModel[]> {
    const entities = await this.phaseComponentItemRepository.getByAllowlistId(
      allowlistId,
    );
    return entities.map(this.phaseComponentItemEntityToResponseApiModel);
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
      await this.phaseComponentItemRepository.getAllowlistPhaseComponentItem({
        allowlistId,
        phaseId,
        phaseComponentId,
        id: phaseComponentItemId,
      });
    if (!phaseComponentItem) {
      throw new BadRequestException('Phase component item not found');
    }
    return this.phaseComponentItemEntityToResponseApiModel(phaseComponentItem);
  }

  private phaseComponentItemEntityToResponseApiModel(
    entity: PhaseComponentItemEntity,
  ): PhaseComponentItemResponseApiModel {
    return {
      id: entity.id,
      phaseComponentId: entity.phase_component_id,
      phaseId: entity.phase_id,
      allowlistId: entity.allowlist_id,
      insertionOrder: entity.insertion_order,
      name: entity.name,
      description: entity.description,
      poolId: entity.pool_id,
      poolType: entity.pool_type as Pool,
      walletsCount: entity.wallets_count,
      tokensCount: entity.tokens_count,
      contract: entity.contract,
      blockNo: entity.block_no,
      consolidateBlockNo: entity.consolidate_block_no,
    };
  }
}
