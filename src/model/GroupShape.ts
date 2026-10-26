import { AppError } from "../shared/AppError.js";
import { Shape } from "./Shape.js";

export class GroupShape extends Shape {
  public readonly tagName = "g";
  public readonly shapeType = "g";
  private readonly children: Shape[] = [];

  public constructor(id: string, private readonly semanticKind = "g", commonAttributes: Record<string, string> = {}) {
    super(id, commonAttributes);
  }

  public isContainer(): boolean {
    return true;
  }

  public isComposite(): boolean {
    return this.semanticKind !== "g";
  }

  public getSemanticKind(): string {
    return this.semanticKind;
  }

  public getChildren(): readonly Shape[] {
    return this.children;
  }

  public getGeometryAttributes(): Readonly<Record<string, string>> {
    return {};
  }

  public addChild(child: Shape, index = this.children.length): void {
    if (child === this || this.isDescendant(child)) {
      throw new AppError(`cannot add ${child.id} to its own descendant`);
    }
    if (child.getParent() !== null) {
      throw new AppError(`shape already has a parent: ${child.id}`);
    }
    if (!Number.isInteger(index) || index < 0 || index > this.children.length) {
      throw new AppError(`invalid child index: ${index}`);
    }
    this.children.splice(index, 0, child);
    child.setParent(this);
  }

  public removeChild(child: Shape): number {
    const index = this.children.indexOf(child);
    if (index < 0) {
      throw new AppError(`shape is not a child of ${this.id}: ${child.id}`);
    }
    this.children.splice(index, 1);
    child.setParent(null);
    return index;
  }

  public indexOf(child: Shape): number {
    return this.children.indexOf(child);
  }

  public move(dx: number, dy: number): void {
    for (const child of this.children) {
      child.move(dx, dy);
    }
  }

  public scale(factor: number): void {
    for (const child of this.children) {
      child.scale(factor);
    }
  }

  public describe(): string {
    const suffix = this.isComposite() ? ` (${this.semanticKind})` : "";
    return `${this.getDisplayName()}${suffix}`;
  }

  private isDescendant(candidate: Shape): boolean {
    let current: GroupShape | null = this;
    while (current !== null) {
      if (candidate === current) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }
}
