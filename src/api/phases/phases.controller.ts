import { Controller, Get, Param } from '@nestjs/common';
import { PhasesService } from './phases.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseResponseApiModel } from './models/phase-response-api.model';

@Controller('/allowlists/:allowlistId/phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @ApiOperation({
    summary: 'Get all phases for allowlist',
  })
  @ApiOkResponse({
    type: PhaseResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<PhaseResponseApiModel[]> {
    return this.phasesService.getByAllowlistId(allowlistId);
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
    return this.phasesService.getPhase({
      allowlistId,
      phaseId,
    });
  }
}
