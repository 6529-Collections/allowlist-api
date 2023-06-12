import { Injectable } from '@nestjs/common';
import { PhasesWithComponentsAndItemsResponseApiModel } from './model/phases-full-api.model';
import { PhaseComponentItemService } from '../phase-component-item/phase-component-item.service';
import { PhaseComponentService } from '../phase-component/phase-component.service';
import { PhaseService } from '../phase/phase.service';

@Injectable()
export class PhaseFullService {
  constructor(
    private readonly phaseComponentItemService: PhaseComponentItemService,
    private readonly phaseComponentService: PhaseComponentService,
    private readonly phaseService: PhaseService,
  ) {}

  async getPhasesWithComponentsAndItems(
    allowlistId: string,
  ): Promise<PhasesWithComponentsAndItemsResponseApiModel[]> {
    const [phases, phaseComponents, phaseComponentItems] = await Promise.all([
      this.phaseService.getByAllowlistId(allowlistId),
      this.phaseComponentService.getByAllowlistId(allowlistId),
      this.phaseComponentItemService.getByAllowlistId(allowlistId),
    ]);
    return phases.map((phase) => {
      const components = phaseComponents.filter(
        (component) => component.phaseId === phase.id,
      );
      return {
        ...phase,
        components: components.map((component) => {
          const items = phaseComponentItems.filter(
            (item) => item.phaseComponentId === component.id,
          );
          return {
            ...component,
            items: items,
          };
        }),
      };
    });
  }
}
