import { PredictBlockNumbersResponseApiModel } from './model/predict-block-numbers-response-api.model';

export const countSubNumbersInRange = ({
  start,
  end,
  subnumbers,
}: {
  start: number;
  end: number;
  subnumbers: number[];
}): PredictBlockNumbersResponseApiModel[] => {
  const occurrencesMap = new Map<number, PredictBlockNumbersResponseApiModel>();

  for (const subnumber of subnumbers) {
    occurrencesMap.set(subnumber, {
      blockNumberIncludes: subnumber,
      count: 0,
      blockNumbers: [],
    });
  }

  for (let i = start; i <= end; i++) {
    const currentNumberString = i.toString();
    for (const subnumber of subnumbers) {
      const subnumberString = subnumber.toString();
      if (currentNumberString.indexOf(subnumberString) !== -1) {
        const occurrence = occurrencesMap.get(subnumber);
        if (occurrence) {
          occurrence.count++;
          occurrence.blockNumbers.push(i);
        }
      }
    }
  }

  return Array.from(occurrencesMap.values()).sort((a, d) => d.count - a.count);
};
