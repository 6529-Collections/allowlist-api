import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistOperationRequestApiModel } from './model/allowlist-operation-request-api.model';
import { AllowlistOperationService } from './allowlist-operation.service';
import { AllowlistOperationResponseApiModel } from './model/allowlist-operation-response-api.model';
import { HaveAllowlistAccess } from '../../decorators/have-allowlist-access.decorator';

@HaveAllowlistAccess()
@Controller('/allowlists/:allowlistId/operations')
export class AllowlistOperationController {
  constructor(
    private readonly allowlistOperationService: AllowlistOperationService,
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
    return this.allowlistOperationService.add({ ...request, allowlistId });
  }

  @ApiOperation({
    summary: 'Adds operations to allowlist.',
  })
  @ApiCreatedResponse({
    type: AllowlistOperationResponseApiModel,
    isArray: true,
  })
  @Post('/batch')
  async createBatch(
    @Body() requests: AllowlistOperationRequestApiModel[],
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistOperationResponseApiModel[]> {
    return this.allowlistOperationService.addBatch(
      requests.map((request) => ({ ...request, allowlistId })),
    );
  }

  @Get()
  async getAll(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistOperationResponseApiModel[]> {
    return this.allowlistOperationService.findByAllowlistId(allowlistId);
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
    await this.allowlistOperationService.delete({
      operationOrder: +operationOrder,
      allowlistId,
    });
  }
}
