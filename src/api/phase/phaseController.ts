import { Controller, Get, Param, Query } from '@nestjs/common';
import { PhaseService } from './phase.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseResponseApiModel } from './model/phase-response-api.model';
import { PhasesWithComponentsAndItemsResponseApiModel } from '../phase-full/model/phases-with-components-and-items-api.model';
import { PhaseFullService } from '../phase-full/phase-full.service';

@Controller('/allowlists/:allowlistId/phases')
export class PhaseController {
  constructor(
    private readonly phaseService: PhaseService,
    private readonly phaseFullService: PhaseFullService,
  ) {}

  @ApiOperation({
    summary: 'Get all phases for allowlist',
  })
  @ApiOkResponse({
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
    @Query('withComponentsAndItems') withComponentsAndItems: boolean,
  ): Promise<
    PhaseResponseApiModel[] | PhasesWithComponentsAndItemsResponseApiModel[]
  > {
    if ((withComponentsAndItems as any) === 'true') {
      return this.phaseFullService.getPhasesWithComponentsAndItems(allowlistId);
    } else {
      return this.phaseService.getByAllowlistId(allowlistId);
    }
  }

  @ApiOperation({
    summary: 'Get phase',
  })
  @ApiOkResponse({
    type: PhaseResponseApiModel,
  })
  @Get(':phaseId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
  ): Promise<PhaseResponseApiModel> {
    return this.phaseService.getPhase({
      allowlistId,
      phaseId,
    });
  }
}
