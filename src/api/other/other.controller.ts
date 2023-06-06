import { Controller, Get, Param } from '@nestjs/common';
import { OtherService } from './other.service';
import { OperationDescriptionsResponseApiModel } from './models/operation-descriptions-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('other')
export class OtherController {
  constructor(private readonly otherService: OtherService) {}

  @ApiOperation({
    summary: 'Get all operation descriptions',
  })
  @ApiOkResponse({
    type: OperationDescriptionsResponseApiModel,
    isArray: true,
  })
  @Get('operations')
  async getOperations(): Promise<OperationDescriptionsResponseApiModel[]> {
    return this.otherService.getOperationDescriptions();
  }

  @ApiOperation({
    summary: 'Get operation descriptions for a given operation type',
  })
  @ApiOkResponse({
    type: OperationDescriptionsResponseApiModel,
    isArray: true,
  })
  @Get('operations/types/:operationType')
  async getOperationsForType(
    @Param('operationType') operationType: string,
  ): Promise<OperationDescriptionsResponseApiModel[]> {
    return this.otherService.getOperationDescriptionsForType(operationType);
  }
}
