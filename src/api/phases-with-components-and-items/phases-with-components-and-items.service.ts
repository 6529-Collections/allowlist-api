import { PhaseComponentItemsRepository } from '../../repositories/phase-component-items/phase-component-items.repository';
import { PhaseComponentsRepository } from '../../repositories/phase-components/phase-components.repository';
import { PhasesRepository } from './../../repositories/phases/phases.repository';
import { Injectable } from '@nestjs/common';
import { PhasesWithComponentsAndItemsResponseApiModel } from './models/phases-with-components-and-items-api.model';

@Injectable()
export class PhasesWithComponentsAndItemsService {
  constructor(
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseComponentsRepository: PhaseComponentsRepository,
    private readonly phaseComponentItemsRepository: PhaseComponentItemsRepository,
  ) {}

  async getPhasesWithComponentsAndItems(
    allowlistId: string,
  ): Promise<PhasesWithComponentsAndItemsResponseApiModel[]> {
    const [phases, phaseComponents, phaseComponentItems] = await Promise.all([
      this.phasesRepository.getByAllowlistId(allowlistId),
      this.phaseComponentsRepository.getByAllowlistId(allowlistId),
      this.phaseComponentItemsRepository.getByAllowlistId(allowlistId),
    ]);
    return phases.map((phase) => {
      const components = phaseComponents.filter(
        (component) => component.phaseId === phase.phaseId,
      );
      return {
        ...phase,
        components: components.map((component) => {
          const items = phaseComponentItems.filter(
            (item) => item.phaseComponentId === component.componentId,
          );
          return {
            ...component,
            items,
          };
        }),
      };
    });
  }
}
