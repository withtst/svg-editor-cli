import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";
import { formatNumber, parseNumber } from "./ValueFormatter.js";

export class CircleShape extends Shape {
  public readonly tagName = "circle";
  public readonly shapeType = "circle";

  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private radius: number,
    commonAttributes: Record<string, string> = {},
  ) {
    super(id, commonAttributes);
    this.ensureRadius();
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {
      cx: formatNumber(this.cx),
      cy: formatNumber(this.cy),
      r: formatNumber(this.radius),
    };
  }

  public getX(): number {
    return this.cx;
  }

  public getY(): number {
    return this.cy;
  }

  public setAttribute(name: string, value: string): void {
    if (this.setCommonAttribute(name, value)) {
      return;
    }

    switch (name) {
      case "cx":
        this.cx = parseNumber(value, name);
        break;
      case "cy":
        this.cy = parseNumber(value, name);
        break;
      case "r":
        {
          const parsed = parseNumber(value, name);
          if (parsed < 0) {
            throw new AppError("circle radius must be non-negative");
          }
          this.radius = parsed;
        }
        break;
      default:
        throw new AppError(`unknown attribute: ${name}`);
    }
    this.ensureRadius();
  }

  public move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  public describe(): string {
    return `${this.getDisplayName()}  cx=${formatNumber(this.cx)} cy=${formatNumber(this.cy)} r=${formatNumber(this.radius)}${this.commonDescription()}`;
  }

  private ensureRadius(): void {
    if (this.radius < 0) {
      throw new AppError("circle radius must be non-negative");
    }
  }
}
