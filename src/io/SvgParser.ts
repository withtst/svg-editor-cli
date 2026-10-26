import { AppError } from "../shared/AppError.js";
import { ShapeFactory } from "../core/ShapeFactory.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { GroupShape } from "../model/GroupShape.js";
import { parseNumber } from "../model/ValueFormatter.js";
import { XmlElement } from "./XmlElement.js";
import { XmlParser } from "./XmlParser.js";

export interface ParsedSvg {
  document: SvgDocument;
  warnings: string[];
}

export class SvgParser {
  public constructor(private readonly factory = new ShapeFactory()) {}

  public parse(source: string): ParsedSvg {
    const root = new XmlParser(source).parse();
    if (root.name !== "svg") {
      throw new AppError("invalid SVG XML: root element must be svg");
    }

    const explicitIds = new Set<string>();
    this.collectExplicitIds(root, explicitIds);
    const usedIds = new Set<string>();
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    const document = new SvgDocument(
      this.dimension(root.attributes.width, 800, "width"),
      this.dimension(root.attributes.height, 600, "height"),
    );

    for (const child of root.children) {
      this.parseShape(child, document, null, usedIds, explicitIds, counters, warnings);
    }

    return { document, warnings };
  }

  private parseShape(
    element: XmlElement,
    document: SvgDocument,
    parent: GroupShape | null,
    usedIds: Set<string>,
    explicitIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): void {
    if (!["rect", "circle", "ellipse", "line", "text", "g"].includes(element.name)) {
      throw new AppError(`unsupported SVG element: ${element.name}`);
    }

    const id = this.resolveId(element, usedIds, explicitIds, counters, warnings);
    if (usedIds.has(id)) {
      throw new AppError(`duplicate id in SVG: ${id}`);
    }
    usedIds.add(id);

    // Phase 1 has no box plugin. Unknown data-kind values intentionally degrade to g.
    const semanticKind = "g";
    const textContent = element.name === "text" ? element.text : "";
    const shape = this.factory.createFromSvg(element.name, id, { ...element.attributes }, textContent, semanticKind);
    document.attachShape(shape, parent);

    if (element.name === "text" && element.children.length > 0) {
      throw new AppError("unsupported nested element inside text");
    }
    if (parent === null && !(shape instanceof GroupShape) && element.children.length > 0) {
      throw new AppError(`unsupported children inside ${element.name}`);
    }

    if (shape instanceof GroupShape) {
      for (const child of element.children) {
        this.parseShape(child, document, shape, usedIds, explicitIds, counters, warnings);
      }
    }
  }

  private resolveId(
    element: XmlElement,
    usedIds: Set<string>,
    explicitIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): string {
    const explicit = element.attributes.id;
    if (explicit !== undefined && explicit.length > 0) {
      return explicit;
    }

    let counter = counters.get(element.name) ?? 1;
    let candidate = `${element.name}${counter}`;
    while (usedIds.has(candidate) || explicitIds.has(candidate)) {
      counter += 1;
      candidate = `${element.name}${counter}`;
    }
    counters.set(element.name, counter + 1);
    warnings.push(`warning: assigned id ${candidate} to unnamed <${element.name}>`);
    return candidate;
  }

  private collectExplicitIds(element: XmlElement, ids: Set<string>): void {
    if (element.name !== "svg" && element.attributes.id !== undefined) {
      ids.add(element.attributes.id);
    }
    for (const child of element.children) {
      this.collectExplicitIds(child, ids);
    }
  }

  private dimension(raw: string | undefined, fallback: number, field: string): number {
    if (raw === undefined || raw.trim() === "") {
      return fallback;
    }
    const normalized = raw.trim().replace(/px$/i, "");
    return parseNumber(normalized, field);
  }
}
