import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";
import { formatNumber, parseNumber } from "./ValueFormatter.js";

export class EllipseShape extends Shape {
  public readonly tagName = "ellipse";
  public readonly shapeType = "ellipse";

  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private rx: number,
    private ry: number,
    commonAttributes: Record<string, string> = {},
  ) {
    super(id, commonAttributes);
    this.ensureRadii();
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {
      cx: formatNumber(this.cx),
      cy: formatNumber(this.cy),
      rx: formatNumber(this.rx),
      ry: formatNumber(this.ry),
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
      case "rx":
        {
          const parsed = parseNumber(value, name);
          if (parsed < 0) {
            throw new AppError("ellipse radii must be non-negative");
          }
          this.rx = parsed;
        }
        break;
      case "ry":
        {
          const parsed = parseNumber(value, name);
          if (parsed < 0) {
            throw new AppError("ellipse radii must be non-negative");
          }
          this.ry = parsed;
        }
        break;
      default:
        throw new AppError(`unknown attribute: ${name}`);
    }
    this.ensureRadii();
  }

  public move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.rx *= factor;
    this.ry *= factor;
  }

  public describe(): string {
    return `${this.getDisplayName()}  cx=${formatNumber(this.cx)} cy=${formatNumber(this.cy)} rx=${formatNumber(this.rx)} ry=${formatNumber(this.ry)}${this.commonDescription()}`;
  }

  private ensureRadii(): void {
    if (this.rx < 0 || this.ry < 0) {
      throw new AppError("ellipse radii must be non-negative");
    }
  }
}
