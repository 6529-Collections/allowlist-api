import { PhaseComponentItemResponseApiModel } from '../../phase-component-item/model/phase-component-item-response-api.model';
import { PhaseComponentResponseApiModel } from '../../phase-component/model/phase-component-response-api.model';
import { PhaseResponseApiModel } from '../../phase/model/phase-response-api.model';

export class PhasesWithComponentsAndItemsResponseApiModelComponent extends PhaseComponentResponseApiModel {
  readonly items: PhaseComponentItemResponseApiModel[];
}

export class PhasesWithComponentsAndItemsResponseApiModel extends PhaseResponseApiModel {
  readonly components: PhasesWithComponentsAndItemsResponseApiModelComponent[];
}
