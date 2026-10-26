import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";
import { escapeXmlText, formatNumber, parseNumber } from "./ValueFormatter.js";

export class TextShape extends Shape {
  public readonly tagName = "text";
  public readonly shapeType = "text";

  public constructor(
    id: string,
    private x: number,
    private y: number,
    private content: string,
    commonAttributes: Record<string, string> = {},
  ) {
    super(id, commonAttributes);
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {
      x: formatNumber(this.x),
      y: formatNumber(this.y),
    };
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getContent(): string {
    return this.content;
  }

  public getAttribute(name: string): string | undefined {
    if (name === "text") {
      return this.content;
    }
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (this.setCommonAttribute(name, value)) {
      return;
    }

    switch (name) {
      case "x":
        this.x = parseNumber(value, name);
        break;
      case "y":
        this.y = parseNumber(value, name);
        break;
      case "text":
        this.content = value;
        break;
      default:
        throw new AppError(`unknown attribute: ${name}`);
    }
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  public describe(): string {
    return `${this.getDisplayName()}  (${formatNumber(this.x)},${formatNumber(this.y)}) "${this.content}"${this.commonDescription()}`;
  }

  public toXmlText(): string {
    return escapeXmlText(this.content);
  }
}
