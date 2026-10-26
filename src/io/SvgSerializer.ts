import { escapeXml, escapeXmlText, formatNumber } from "../model/ValueFormatter.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { TextShape } from "../model/TextShape.js";

export class SvgSerializer {
  public serialize(document: SvgDocument): string {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(document.width)}" height="${formatNumber(document.height)}" viewBox="0 0 ${formatNumber(document.width)} ${formatNumber(document.height)}">`,
    ];
    for (const shape of document.getChildren()) {
      this.appendShape(lines, shape, 2);
    }
    lines.push("</svg>");
    return `${lines.join("\n")}\n`;
  }

  private appendShape(lines: string[], shape: Shape, indent: number): void {
    const prefix = " ".repeat(indent);
    const attributes = this.attributesFor(shape);
    if (shape instanceof GroupShape) {
      if (shape.getChildren().length === 0) {
        lines.push(`${prefix}<g ${attributes}/>`);
        return;
      }
      lines.push(`${prefix}<g ${attributes}>`);
      for (const child of shape.getChildren()) {
        this.appendShape(lines, child, indent + 2);
      }
      lines.push(`${prefix}</g>`);
      return;
    }

    if (shape instanceof TextShape) {
      lines.push(`${prefix}<text ${attributes}>${escapeXmlText(shape.getContent())}</text>`);
      return;
    }
    lines.push(`${prefix}<${shape.tagName} ${attributes}/>`);
  }

  private attributesFor(shape: Shape): string {
    const attributes: string[] = [`id="${escapeXml(shape.id)}"`];
    for (const [name, value] of Object.entries(shape.getGeometryAttributes())) {
      attributes.push(`${name}="${escapeXml(value)}"`);
    }
    for (const name of ["fill", "stroke", "stroke-width", "transform"]) {
      const value = shape.getAttribute(name);
      if (value !== undefined) {
        attributes.push(`${name}="${escapeXml(value)}"`);
      }
    }
    if (shape instanceof GroupShape && shape.isComposite()) {
      attributes.push(`data-kind="${escapeXml(shape.getSemanticKind())}"`);
    }
    return attributes.join(" ");
  }
}
