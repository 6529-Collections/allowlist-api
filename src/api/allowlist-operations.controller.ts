import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistOperationResponseApiModel } from './models/allowlist-operation-response-api.model';
import { AllowlistOperationRequestApiModel } from './models/allowlist-operation-request-api.model';
import { AllowlistOperationsService } from './services/allowlist-operations.service';

@Controller('/allowlists/:allowlistId/operations')
export class AllowlistOperationsController {
  constructor(
    private readonly allowlistOperationsService: AllowlistOperationsService,
  ) {}

  @ApiOperation({
    summary: 'Adds operation to allowlist.',
  })
  @ApiCreatedResponse({
    type: AllowlistOperationResponseApiModel,
  })
  @Post()
  async create(
    @Body() request: AllowlistOperationRequestApiModel,
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistOperationResponseApiModel> {
    return this.allowlistOperationsService.add({ ...request, allowlistId });
  }

  @ApiOperation({
    summary: 'Deletes operation from allowlist.',
  })
  @ApiOkResponse()
  @Delete(':operationOrder')
  async delete(
    @Param('allowlistId') allowlistId: string,
    @Param('operationOrder') operationOrder: number,
  ) {
    if (!(+operationOrder > 0)) {
      throw new BadRequestException('operation order must be a number');
    }
    await this.allowlistOperationsService.delete({
      operationOrder,
      allowlistId,
    });
  }
}
