import { Controller, Get, Param } from '@nestjs/common';
import { PhasesWithComponentsAndItemsService } from './phases-with-components-and-items.service';
import { PhasesWithComponentsAndItemsResponseApiModel } from './models/phases-with-components-and-items-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/allowlists/:allowlistId/phases-with-components-and-items')
export class PhasesWithComponentsAndItemsController {
  constructor(
    private readonly phasesWithComponentsAndItemsService: PhasesWithComponentsAndItemsService,
  ) {}

  @ApiOperation({
    summary: 'Get all phases with components and items for allowlist',
  })
  @ApiOkResponse({
    type: PhasesWithComponentsAndItemsResponseApiModel,
    isArray: true,
  })
  @Get()
  async getPhasesWithComponentsAndItems(
    @Param('allowlistId') allowlistId: string,
  ): Promise<PhasesWithComponentsAndItemsResponseApiModel[]> {
    return this.phasesWithComponentsAndItemsService.getPhasesWithComponentsAndItems(
      allowlistId,
    );
  }
}
