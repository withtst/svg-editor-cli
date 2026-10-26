import { AppError } from "../shared/AppError.js";
import { formatNumber } from "./ValueFormatter.js";
import type { GroupShape } from "./GroupShape.js";

const COMMON_ATTRIBUTES = new Set(["fill", "stroke", "stroke-width", "transform"]);

export abstract class Shape {
  private parent: GroupShape | null = null;
  private readonly commonAttributes = new Map<string, string>();

  public abstract readonly tagName: string;
  public abstract readonly shapeType: string;

  protected constructor(public readonly id: string, commonAttributes: Record<string, string> = {}) {
    if (!id || /\s/.test(id)) {
      throw new AppError(`invalid shape id: ${id}`);
    }

    for (const [name, value] of Object.entries(commonAttributes)) {
      if (COMMON_ATTRIBUTES.has(name)) {
        this.commonAttributes.set(name, value);
      }
    }
  }

  public getParent(): GroupShape | null {
    return this.parent;
  }

  public setParent(parent: GroupShape | null): void {
    this.parent = parent;
  }

  public getDisplayName(): string {
    return `${this.tagName}#${this.id}`;
  }

  public getCommonAttributes(): ReadonlyMap<string, string> {
    return this.commonAttributes;
  }

  public getAttribute(name: string): string | undefined {
    return this.commonAttributes.get(name) ?? this.getGeometryAttributes()[name];
  }

  protected setCommonAttribute(name: string, value: string): boolean {
    if (!COMMON_ATTRIBUTES.has(name)) {
      return false;
    }

    if (name === "stroke-width") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 0) {
        throw new AppError(`invalid value for stroke-width: ${value}`);
      }
      this.commonAttributes.set(name, formatNumber(numeric));
      return true;
    }

    this.commonAttributes.set(name, value);
    return true;
  }

  public setAttribute(name: string, value: string): void {
    if (this.setCommonAttribute(name, value)) {
      return;
    }
    throw new AppError(`unknown attribute: ${name}`);
  }

  public restoreAttribute(name: string, value: string | undefined): void {
    if (COMMON_ATTRIBUTES.has(name)) {
      if (value === undefined) {
        this.commonAttributes.delete(name);
      } else {
        this.setCommonAttribute(name, value);
      }
      return;
    }
    if (value === undefined) {
      throw new AppError(`cannot remove required attribute: ${name}`);
    }
    this.setAttribute(name, value);
  }

  public abstract getGeometryAttributes(): Readonly<Record<string, string>>;

  public abstract move(dx: number, dy: number): void;

  public abstract scale(factor: number): void;

  public abstract describe(): string;

  public isContainer(): boolean {
    return false;
  }

  public isComposite(): boolean {
    return false;
  }

  public getSemanticKind(): string {
    return this.shapeType;
  }

  public getChildren(): readonly Shape[] {
    return [];
  }

  protected commonDescription(): string {
    const values: string[] = [];
    for (const name of ["fill", "stroke", "stroke-width"]) {
      const value = this.commonAttributes.get(name);
      if (value !== undefined) {
        values.push(`${name}=${value}`);
      }
    }
    return values.length > 0 ? ` ${values.join(" ")}` : "";
  }

  protected commonXmlAttributes(): string {
    const values: string[] = [];
    for (const name of ["fill", "stroke", "stroke-width", "transform"]) {
      const value = this.commonAttributes.get(name);
      if (value !== undefined) {
        values.push(`${name}="${value}"`);
      }
    }
    return values.join(" ");
  }

  public getXmlAttributes(): string {
    const geometry = Object.entries(this.getGeometryAttributes()).map(
      ([name, value]) => `${name}="${value}"`,
    );
    const common = this.commonXmlAttributes();
    const values = [`id="${this.id}"`, ...geometry];
    if (common) {
      values.push(common);
    }
    return values.join(" ");
  }
}
