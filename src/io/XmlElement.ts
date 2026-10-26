export class XmlElement {
  public constructor(
    public readonly name: string,
    public readonly attributes: Readonly<Record<string, string>>,
    public readonly children: readonly XmlElement[],
    public readonly text: string,
  ) {}
}
