import { Controller, Get, Param } from '@nestjs/common';
import { PhaseFullService } from './phase-full.service';
import { PhasesWithComponentsAndItemsResponseApiModel } from './model/phases-with-components-and-items-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/allowlists/:allowlistId/phases-with-components-and-items')
export class PhaseFullController {
  constructor(private readonly phaseFullService: PhaseFullService) {}

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
    return this.phaseFullService.getPhasesWithComponentsAndItems(allowlistId);
  }
}
