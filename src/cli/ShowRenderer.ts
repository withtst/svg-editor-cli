import { AppError } from "../shared/AppError.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { TextShape } from "../model/TextShape.js";

export class ShowRenderer {
  public render(document: SvgDocument, id: string): string {
    const shape = document.findById(id);
    if (shape === null) {
      throw new AppError(`no such shape: ${id}`);
    }

    const lines = [`${shape.getDisplayName()}  parent=${shape.getParent()?.getDisplayName() ?? "svg"}`];
    for (const [name, value] of Object.entries(shape.getGeometryAttributes())) {
      lines.push(`  ${name}=${value}`);
    }
    if (shape instanceof TextShape) {
      lines.push(`  text="${shape.getContent()}"`);
    }
    for (const name of ["fill", "stroke", "stroke-width", "transform"]) {
      const value = shape.getAttribute(name);
      if (value !== undefined) {
        lines.push(`  ${name}=${value}`);
      }
    }
    if (shape.isContainer()) {
      lines.push(`  children=${shape.getChildren().length}`);
    }
    return lines.join("\n");
  }
}
