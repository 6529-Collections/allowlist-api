import { PhaseComponentItemResponseApiModel } from '../../phase-component-items/models/phase-component-item-response-api.model';
import { PhaseComponentResponseApiModel } from '../../phase-components/models/phase-component-response-api.model';
import { PhaseResponseApiModel } from '../../phases/models/phase-response-api.model';

export class PhasesWithComponentsAndItemsResponseApiModelComponent extends PhaseComponentResponseApiModel {
  readonly items: PhaseComponentItemResponseApiModel[];
}

export class PhasesWithComponentsAndItemsResponseApiModel extends PhaseResponseApiModel {
  readonly components: PhasesWithComponentsAndItemsResponseApiModelComponent[];
}
