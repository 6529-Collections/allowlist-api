import { Controller, Get, Param } from '@nestjs/common';
import { PhaseComponentItemService } from './phase-component-item.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseComponentItemResponseApiModel } from './model/phase-component-item-response-api.model';

@Controller(
  '/allowlists/:allowlistId/phases/:phaseId/components/:phaseComponentId/items',
)
export class PhaseComponentItemController {
  constructor(
    private readonly phaseComponentItemService: PhaseComponentItemService,
  ) {}

  @ApiOperation({
    summary: 'Get all items for phase component',
  })
  @ApiOkResponse({
    type: PhaseComponentItemResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByPhaseComponentId(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
    @Param('phaseComponentId') phaseComponentId: string,
  ): Promise<PhaseComponentItemResponseApiModel[]> {
    return this.phaseComponentItemService.getByPhaseComponentId({
      allowlistId,
      phaseId,
      phaseComponentId,
    });
  }

  @ApiOperation({
    summary: 'Get phase component item',
  })
  @ApiOkResponse({
    type: PhaseComponentItemResponseApiModel,
  })
  @Get(':phaseComponentItemId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
    @Param('phaseComponentId') phaseComponentId: string,
    @Param('phaseComponentItemId') phaseComponentItemId: string,
  ): Promise<PhaseComponentItemResponseApiModel> {
    return this.phaseComponentItemService.getPhaseComponentItem({
      allowlistId,
      phaseId,
      phaseComponentId,
      phaseComponentItemId,
    });
  }
}
