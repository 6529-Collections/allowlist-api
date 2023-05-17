import { Controller, Get, Param } from '@nestjs/common';
import { PhaseComponentItemsService } from './phase-component-items.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseComponentItemResponseApiModel } from './models/phase-component-item-response-api.model';

@Controller(
  '/allowlists/:allowlistId/phases/:phaseId/components/:phaseComponentId/items',
)
export class PhaseComponentItemsController {
  constructor(
    private readonly phaseComponentItemsService: PhaseComponentItemsService,
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
    return this.phaseComponentItemsService.getByPhaseComponentId({
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
    return this.phaseComponentItemsService.getPhaseComponentItem({
      allowlistId,
      phaseId,
      phaseComponentId,
      phaseComponentItemId,
    });
  }
}
