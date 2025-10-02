export class AlchemyConfig {
  readonly key: string;
  constructor({ key }: { readonly key: string }) {
    this.key = key;
  }
}
