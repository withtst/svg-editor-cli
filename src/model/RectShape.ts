import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";
import { formatNumber, parseNumber } from "./ValueFormatter.js";

export class RectShape extends Shape {
  public readonly tagName = "rect";
  public readonly shapeType = "rect";

  public constructor(
    id: string,
    private x: number,
    private y: number,
    private width: number,
    private height: number,
    commonAttributes: Record<string, string> = {},
  ) {
    super(id, commonAttributes);
    this.ensureDimensions();
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {
      x: formatNumber(this.x),
      y: formatNumber(this.y),
      width: formatNumber(this.width),
      height: formatNumber(this.height),
    };
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
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
      case "width":
        {
          const parsed = parseNumber(value, name);
          if (parsed < 0) {
            throw new AppError("rect width and height must be non-negative");
          }
          this.width = parsed;
        }
        break;
      case "height":
        {
          const parsed = parseNumber(value, name);
          if (parsed < 0) {
            throw new AppError("rect width and height must be non-negative");
          }
          this.height = parsed;
        }
        break;
      default:
        throw new AppError(`unknown attribute: ${name}`);
    }
    this.ensureDimensions();
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  public describe(): string {
    return `${this.getDisplayName()}  x=${formatNumber(this.x)} y=${formatNumber(this.y)} w=${formatNumber(this.width)} h=${formatNumber(this.height)}${this.commonDescription()}`;
  }

  private ensureDimensions(): void {
    if (this.width < 0 || this.height < 0) {
      throw new AppError("rect width and height must be non-negative");
    }
  }
}
