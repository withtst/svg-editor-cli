import { AppError } from "../shared/AppError.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class TreeRenderer {
  public render(document: SvgDocument, id?: string): string {
    if (id === undefined) {
      const lines = [`svg (${document.width}x${document.height})`];
      this.appendChildren(lines, document.getChildren(), "");
      return lines.join("\n");
    }

    const shape = document.findById(id);
    if (shape === null) {
      throw new AppError(`no such shape: ${id}`);
    }
    const lines = [shape.describe()];
    this.appendChildren(lines, shape.getChildren(), "");
    return lines.join("\n");
  }

  private appendChildren(lines: string[], children: readonly Shape[], prefix: string): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      lines.push(`${prefix}${isLast ? "└── " : "├── "}${child.describe()}`);
      this.appendChildren(lines, child.getChildren(), `${prefix}${isLast ? "    " : "│   "}`);
    });
  }
}
