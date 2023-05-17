import { BadRequestException, Injectable } from '@nestjs/common';
import { PhaseComponentsRepository } from '../../repositories/phase-components/phase-components.repository';
import { PhaseComponentResponseApiModel } from './models/phase-component-response-api.model';

@Injectable()
export class PhaseComponentsService {
  constructor(
    private readonly phaseComponentsRepository: PhaseComponentsRepository,
  ) {}

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseComponentResponseApiModel[]> {
    return this.phaseComponentsRepository.getByPhaseId(param);
  }

  async getPhaseComponent(param: {
    allowlistId: string;
    phaseId: string;
    componentId: string;
  }): Promise<PhaseComponentResponseApiModel> {
    const { allowlistId, phaseId, componentId } = param;
    const phaseComponent =
      this.phaseComponentsRepository.getAllowlistPhaseComponent({
        allowlistId,
        phaseId,
        componentId,
      });
    if (!phaseComponent) {
      throw new BadRequestException('Phase component not found');
    }
    return phaseComponent;
  }
}
