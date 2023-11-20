export function createQuestionMarks(count: number): string {
  return new Array(count).fill('?').join(', ');
}
