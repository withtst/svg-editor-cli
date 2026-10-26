import { AppError } from "../shared/AppError.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";

export abstract class DocumentCommand {
  protected constructor(protected readonly document: SvgDocument) {}

  protected shapeById(id: string): Shape {
    const shape = this.document.findById(id);
    if (shape === null) {
      throw new AppError(`no such shape: ${id}`);
    }
    return shape;
  }

  protected containerById(id: string): GroupShape {
    const shape = this.document.findById(id);
    if (shape === null) {
      throw new AppError(`no such container: ${id}`);
    }
    if (!(shape instanceof GroupShape)) {
      throw new AppError(`not a container: ${id}`);
    }
    return shape;
  }

  protected positionOf(shape: Shape): { x: string; y: string } | null {
    const geometry = shape.getGeometryAttributes();
    if (geometry.x !== undefined && geometry.y !== undefined) {
      return { x: geometry.x, y: geometry.y };
    }
    if (geometry.cx !== undefined && geometry.cy !== undefined) {
      return { x: geometry.cx, y: geometry.cy };
    }
    if (geometry.x1 !== undefined && geometry.y1 !== undefined) {
      return { x: geometry.x1, y: geometry.y1 };
    }
    return null;
  }

  protected parentDescription(shape: Shape): string {
    return shape.getParent()?.getDisplayName() ?? "svg";
  }
}
