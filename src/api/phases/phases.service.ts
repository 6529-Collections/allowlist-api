import { BadRequestException, Injectable } from '@nestjs/common';
import { PhasesRepository } from '../../repositories/phases/phases.repository';
import { PhaseResponseApiModel } from './models/phase-response-api.model';

@Injectable()
export class PhasesService {
  constructor(private readonly phasesRepository: PhasesRepository) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseResponseApiModel[]> {
    return this.phasesRepository.getByAllowlistId(allowlistId);
  }

  async getPhase(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseResponseApiModel> {
    const { allowlistId, phaseId } = param;
    const phase = this.phasesRepository.getAllowlistPhase({
      allowlistId,
      phaseId,
    });
    if (!phase) {
      throw new BadRequestException('Phase not found');
    }
    return phase;
  }
}
