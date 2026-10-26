import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";
import { formatNumber, parseNumber } from "./ValueFormatter.js";

export class LineShape extends Shape {
  public readonly tagName = "line";
  public readonly shapeType = "line";

  public constructor(
    id: string,
    private x1: number,
    private y1: number,
    private x2: number,
    private y2: number,
    commonAttributes: Record<string, string> = {},
  ) {
    super(id, commonAttributes);
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {
      x1: formatNumber(this.x1),
      y1: formatNumber(this.y1),
      x2: formatNumber(this.x2),
      y2: formatNumber(this.y2),
    };
  }

  public getX(): number {
    return this.x1;
  }

  public getY(): number {
    return this.y1;
  }

  public setAttribute(name: string, value: string): void {
    if (this.setCommonAttribute(name, value)) {
      return;
    }

    switch (name) {
      case "x1":
        this.x1 = parseNumber(value, name);
        break;
      case "y1":
        this.y1 = parseNumber(value, name);
        break;
      case "x2":
        this.x2 = parseNumber(value, name);
        break;
      case "y2":
        this.y2 = parseNumber(value, name);
        break;
      default:
        throw new AppError(`unknown attribute: ${name}`);
    }
  }

  public move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  public scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  public describe(): string {
    return `${this.getDisplayName()}  (${formatNumber(this.x1)},${formatNumber(this.y1)}) -> (${formatNumber(this.x2)},${formatNumber(this.y2)})${this.commonDescription()}`;
  }
}
