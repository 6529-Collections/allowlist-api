import { Controller, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistDescriptionRequestApiModel } from '../allowlist/model/allowlist-description-request-api.model';
import { AllowlistService } from '../allowlist/allowlist.service';
import { AllowlistDescriptionResponseApiModel } from '../allowlist/model/allowlist-description-response-api.model';

@Controller('/allowlists/:allowlistId/runs')
export class AllowlistRunController {
  constructor(private readonly allowlistService: AllowlistService) {}

  @ApiOperation({
    summary: 'Run allowlist',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @ApiCreatedResponse({
    type: AllowlistDescriptionResponseApiModel,
  })
  @Post()
  async create(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    return await this.allowlistService.planRun(allowlistId);
  }
}
