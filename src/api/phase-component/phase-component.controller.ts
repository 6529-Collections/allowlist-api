import { Controller, Get, Param } from '@nestjs/common';
import { PhaseComponentService } from './phase-component.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PhaseComponentResponseApiModel } from './model/phase-component-response-api.model';
import { HaveAllowlistAccess } from '../../decorators/have-allowlist-access.decorator';

@HaveAllowlistAccess()
@Controller('/allowlists/:allowlistId/phases/:phaseId/components')
export class PhaseComponentController {
  constructor(private readonly phaseComponentService: PhaseComponentService) {}

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
    return this.phaseComponentService.getByPhaseId({
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
    return this.phaseComponentService.getPhaseComponent({
      allowlistId,
      phaseId,
      componentId,
    });
  }
}
