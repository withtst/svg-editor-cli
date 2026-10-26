import { AppError } from "../shared/AppError.js";
import { CircleShape } from "../model/CircleShape.js";
import { EllipseShape } from "../model/EllipseShape.js";
import { GroupShape } from "../model/GroupShape.js";
import { LineShape } from "../model/LineShape.js";
import { RectShape } from "../model/RectShape.js";
import { Shape } from "../model/Shape.js";
import { TextShape } from "../model/TextShape.js";
import { parseNumber } from "../model/ValueFormatter.js";

type ShapeCreator = (id: string, args: string[]) => Shape;

export class ShapeFactory {
  private readonly creators = new Map<string, ShapeCreator>([
    ["rect", (id, args) => this.createRect(id, args)],
    ["circle", (id, args) => this.createCircle(id, args)],
    ["ellipse", (id, args) => this.createEllipse(id, args)],
    ["line", (id, args) => this.createLine(id, args)],
    ["text", (id, args) => this.createText(id, args)],
    ["g", (id, args) => this.createGroup(id, args)],
  ]);

  public create(type: string, id: string, args: string[]): Shape {
    const normalizedType = type.toLowerCase();
    const creator = this.creators.get(normalizedType);
    if (creator === undefined) {
      throw new AppError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    return creator(id, args);
  }

  public createFromSvg(
    type: string,
    id: string,
    attributes: Record<string, string>,
    textContent = "",
    semanticKind = "g",
  ): Shape {
    const common = this.commonAttributes(attributes);
    switch (type) {
      case "rect":
        return new RectShape(
          id,
          this.attributeNumber(attributes, "x"),
          this.attributeNumber(attributes, "y"),
          this.attributeNumber(attributes, "width"),
          this.attributeNumber(attributes, "height"),
          common,
        );
      case "circle":
        return new CircleShape(
          id,
          this.attributeNumber(attributes, "cx"),
          this.attributeNumber(attributes, "cy"),
          this.attributeNumber(attributes, "r"),
          common,
        );
      case "ellipse":
        return new EllipseShape(
          id,
          this.attributeNumber(attributes, "cx"),
          this.attributeNumber(attributes, "cy"),
          this.attributeNumber(attributes, "rx"),
          this.attributeNumber(attributes, "ry"),
          common,
        );
      case "line":
        return new LineShape(
          id,
          this.attributeNumber(attributes, "x1"),
          this.attributeNumber(attributes, "y1"),
          this.attributeNumber(attributes, "x2"),
          this.attributeNumber(attributes, "y2"),
          common,
        );
      case "text":
        return new TextShape(
          id,
          this.attributeNumber(attributes, "x"),
          this.attributeNumber(attributes, "y"),
          textContent,
          common,
        );
      case "g":
        return new GroupShape(id, semanticKind, common);
      default:
        throw new AppError(`unsupported SVG element: ${type}`);
    }
  }

  private createRect(id: string, args: string[]): Shape {
    this.ensureArgumentCount("rect", args, 4, 5);
    return new RectShape(
      id,
      parseNumber(args[0], "x"),
      parseNumber(args[1], "y"),
      parseNumber(args[2], "width"),
      parseNumber(args[3], "height"),
      args[4] === undefined ? {} : { fill: args[4] },
    );
  }

  private createCircle(id: string, args: string[]): Shape {
    this.ensureArgumentCount("circle", args, 3, 4);
    return new CircleShape(
      id,
      parseNumber(args[0], "cx"),
      parseNumber(args[1], "cy"),
      parseNumber(args[2], "r"),
      args[3] === undefined ? {} : { fill: args[3] },
    );
  }

  private createEllipse(id: string, args: string[]): Shape {
    this.ensureArgumentCount("ellipse", args, 4, 5);
    return new EllipseShape(
      id,
      parseNumber(args[0], "cx"),
      parseNumber(args[1], "cy"),
      parseNumber(args[2], "rx"),
      parseNumber(args[3], "ry"),
      args[4] === undefined ? {} : { fill: args[4] },
    );
  }

  private createLine(id: string, args: string[]): Shape {
    this.ensureArgumentCount("line", args, 4, 5);
    return new LineShape(
      id,
      parseNumber(args[0], "x1"),
      parseNumber(args[1], "y1"),
      parseNumber(args[2], "x2"),
      parseNumber(args[3], "y2"),
      args[4] === undefined ? {} : { stroke: args[4] },
    );
  }

  private createText(id: string, args: string[]): Shape {
    this.ensureArgumentCount("text", args, 3, 3);
    return new TextShape(id, parseNumber(args[0], "x"), parseNumber(args[1], "y"), args[2]);
  }

  private createGroup(id: string, args: string[]): Shape {
    this.ensureArgumentCount("g", args, 0, 0);
    return new GroupShape(id);
  }

  private commonAttributes(attributes: Record<string, string>): Record<string, string> {
    const common: Record<string, string> = {};
    for (const name of ["fill", "stroke", "stroke-width", "transform"]) {
      if (attributes[name] !== undefined) {
        common[name] = attributes[name];
      }
    }
    return common;
  }

  private attributeNumber(attributes: Record<string, string>, name: string): number {
    return parseNumber(attributes[name] ?? "0", name);
  }

  private ensureArgumentCount(type: string, args: string[], min: number, max: number): void {
    if (args.length < min || args.length > max) {
      throw new AppError(`invalid arguments for create ${type}`);
    }
  }
}
