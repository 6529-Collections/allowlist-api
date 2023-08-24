import { Controller, Get, Param } from '@nestjs/common';
import { ResultService } from './result.service';
import { ResultResponseApiModel } from './models/result-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { HaveAllowlistAccess } from '../../decorators/have-allowlist-access.decorator';

@HaveAllowlistAccess()
@Controller('/allowlists/:allowlistId/results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @ApiOperation({
    summary: 'Get all results for allowlist',
  })
  @ApiOkResponse({
    type: ResultResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<ResultResponseApiModel[]> {
    return this.resultService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get all results for phase',
  })
  @ApiOkResponse({
    type: ResultResponseApiModel,
    isArray: true,
  })
  @Get('/phases/:phaseId')
  async getByPhaseId(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
  ): Promise<ResultResponseApiModel[]> {
    return this.resultService.getByPhaseId({
      allowlistId,
      phaseId,
    });
  }

  @ApiOperation({
    summary: 'Get all results for phase component',
  })
  @ApiOkResponse({
    type: ResultResponseApiModel,
    isArray: true,
  })
  @Get('/phases/:phaseId/components/:phaseComponentId')
  async getByPhaseComponentId(
    @Param('allowlistId') allowlistId: string,
    @Param('phaseId') phaseId: string,
    @Param('phaseComponentId') phaseComponentId: string,
  ): Promise<ResultResponseApiModel[]> {
    return this.resultService.getByPhaseComponentId({
      allowlistId,
      phaseId,
      phaseComponentId,
    });
  }
}
