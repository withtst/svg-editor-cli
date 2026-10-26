import { AppError } from "../shared/AppError.js";
import { decodeXml } from "../model/ValueFormatter.js";
import { XmlElement } from "./XmlElement.js";

export class XmlParser {
  private position = 0;

  public constructor(private readonly source: string) {}

  public parse(): XmlElement {
    this.skipWhitespaceAndMisc();
    const root = this.parseElement();
    this.skipWhitespaceAndMisc();
    if (this.position !== this.source.length) {
      throw new AppError("invalid SVG XML: unexpected content after root element");
    }
    return root;
  }

  private parseElement(): XmlElement {
    this.expect("<");
    if (this.peek("/")) {
      throw new AppError("invalid SVG XML: unexpected closing tag");
    }

    const name = this.readName();
    const attributes: Record<string, string> = {};
    let selfClosing = false;

    while (true) {
      this.skipWhitespace();
      if (this.peek("/>") ) {
        this.position += 2;
        selfClosing = true;
        break;
      }
      if (this.peek(">")) {
        this.position += 1;
        break;
      }

      const attributeName = this.readName();
      this.skipWhitespace();
      this.expect("=");
      this.skipWhitespace();
      const quote = this.source[this.position];
      if (quote !== '"' && quote !== "'") {
        throw new AppError("invalid SVG XML: attribute value must be quoted");
      }
      this.position += 1;
      const valueStart = this.position;
      const end = this.source.indexOf(quote, this.position);
      if (end < 0) {
        throw new AppError("invalid SVG XML: unterminated attribute");
      }
      attributes[attributeName] = decodeXml(this.source.slice(valueStart, end));
      this.position = end + 1;
    }

    if (selfClosing) {
      return new XmlElement(name, attributes, [], "");
    }

    const children: XmlElement[] = [];
    const textParts: string[] = [];
    while (this.position < this.source.length) {
      if (this.peek(`</${name}`)) {
        this.position += 2 + name.length;
        this.skipWhitespace();
        this.expect(">");
        return new XmlElement(name, attributes, children, textParts.join(""));
      }
      if (this.peek("<!--")) {
        this.skipUntil("-->");
        continue;
      }
      if (this.peek("<![CDATA[")) {
        this.position += "<![CDATA[".length;
        const end = this.source.indexOf("]]>", this.position);
        if (end < 0) {
          throw new AppError("invalid SVG XML: unterminated CDATA");
        }
        textParts.push(this.source.slice(this.position, end));
        this.position = end + 3;
        continue;
      }
      if (this.peek("<?")) {
        this.skipUntil("?>");
        continue;
      }
      if (this.peek("<!")) {
        this.skipUntil(">");
        continue;
      }
      if (this.peek("<")) {
        children.push(this.parseElement());
        continue;
      }

      const nextTag = this.source.indexOf("<", this.position);
      const end = nextTag < 0 ? this.source.length : nextTag;
      textParts.push(decodeXml(this.source.slice(this.position, end)));
      this.position = end;
    }

    throw new AppError(`invalid SVG XML: missing closing tag for ${name}`);
  }

  private readName(): string {
    const start = this.position;
    while (this.position < this.source.length && /[A-Za-z0-9_.:-]/.test(this.source[this.position])) {
      this.position += 1;
    }
    if (start === this.position) {
      throw new AppError("invalid SVG XML: expected name");
    }
    return this.source.slice(start, this.position);
  }

  private skipWhitespace(): void {
    while (this.position < this.source.length && /\s/.test(this.source[this.position])) {
      this.position += 1;
    }
  }

  private skipWhitespaceAndMisc(): void {
    while (this.position < this.source.length) {
      this.skipWhitespace();
      if (this.peek("<!--")) {
        this.skipUntil("-->");
        continue;
      }
      if (this.peek("<?")) {
        this.skipUntil("?>");
        continue;
      }
      if (this.peek("<!")) {
        this.skipUntil(">");
        continue;
      }
      break;
    }
  }

  private skipUntil(endMarker: string): void {
    const end = this.source.indexOf(endMarker, this.position);
    if (end < 0) {
      throw new AppError(`invalid SVG XML: missing ${endMarker}`);
    }
    this.position = end + endMarker.length;
  }

  private expect(value: string): void {
    if (!this.peek(value)) {
      throw new AppError(`invalid SVG XML: expected ${value}`);
    }
    this.position += value.length;
  }

  private peek(value: string): boolean {
    return this.source.startsWith(value, this.position);
  }
}
