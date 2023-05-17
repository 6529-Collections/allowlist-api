import { Controller, Get, Param } from '@nestjs/common';
import { PhaseComponentsService } from './phase-components.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseComponentResponseApiModel } from './models/phase-component-response-api.model';

@Controller('/allowlists/:allowlistId/phases/:phaseId/components')
export class PhaseComponentsController {
  constructor(
    private readonly phaseComponentsService: PhaseComponentsService,
  ) {}

  @ApiOperation({
    summary: 'Get all components for phase',
  })
  @ApiOkResponse({
    type: PhaseComponentResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByPhaseId(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
  ): Promise<PhaseComponentResponseApiModel[]> {
    return this.phaseComponentsService.getByPhaseId({
      allowlistId,
      phaseId,
    });
  }

  @ApiOperation({
    summary: 'Get phase component',
  })
  @ApiOkResponse({
    type: PhaseComponentResponseApiModel,
  })
  @Get(':componentId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
    @Param('componentId') componentId: string,
  ): Promise<PhaseComponentResponseApiModel> {
    return this.phaseComponentsService.getPhaseComponent({
      allowlistId,
      phaseId,
      componentId,
    });
  }
}
