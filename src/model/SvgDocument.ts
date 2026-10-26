import { AppError } from "../shared/AppError.js";
import { GroupShape } from "./GroupShape.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  private readonly rootChildren: Shape[] = [];

  public constructor(public width = 800, public height = 600) {
    this.ensureSize(width, height);
  }

  public getChildren(): readonly Shape[] {
    return this.rootChildren;
  }

  public setSize(width: number, height: number): void {
    this.ensureSize(width, height);
    this.width = width;
    this.height = height;
  }

  public findById(id: string): Shape | null {
    for (const shape of this.rootChildren) {
      const found = this.findIn(shape, id);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  public attachShape(shape: Shape, parent: GroupShape | null, index?: number): void {
    if (this.findById(shape.id) !== null) {
      throw new AppError(`id already exists: ${shape.id}`);
    }
    if (shape.getParent() !== null) {
      throw new AppError(`shape already has a parent: ${shape.id}`);
    }

    if (parent === null) {
      const targetIndex = index ?? this.rootChildren.length;
      if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex > this.rootChildren.length) {
        throw new AppError(`invalid child index: ${targetIndex}`);
      }
      this.rootChildren.splice(targetIndex, 0, shape);
      return;
    }

    if (this.findByIdentity(parent) === null) {
      throw new AppError(`container is not in document: ${parent.id}`);
    }
    parent.addChild(shape, index);
  }

  public detachShape(shape: Shape): { parent: GroupShape | null; index: number } {
    const parent = shape.getParent();
    if (parent !== null) {
      const index = parent.removeChild(shape);
      return { parent, index };
    }

    const index = this.rootChildren.indexOf(shape);
    if (index < 0) {
      throw new AppError(`shape is not in document: ${shape.id}`);
    }
    this.rootChildren.splice(index, 1);
    return { parent: null, index };
  }

  public isInDocument(shape: Shape): boolean {
    return this.findByIdentity(shape) !== null;
  }

  public isDescendantOf(shape: Shape, ancestor: GroupShape): boolean {
    let current = shape.getParent();
    while (current !== null) {
      if (current === ancestor) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  public countElements(): number {
    let count = 0;
    for (const shape of this.rootChildren) {
      count += this.countShape(shape);
    }
    return count;
  }

  public walk(): Shape[] {
    const result: Shape[] = [];
    for (const shape of this.rootChildren) {
      this.collect(shape, result);
    }
    return result;
  }

  private findIn(shape: Shape, id: string): Shape | null {
    if (shape.id === id) {
      return shape;
    }
    for (const child of shape.getChildren()) {
      const found = this.findIn(child, id);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  private findByIdentity(target: Shape): Shape | null {
    return this.walk().find((shape) => shape === target) ?? null;
  }

  private countShape(shape: Shape): number {
    return 1 + shape.getChildren().reduce((sum, child) => sum + this.countShape(child), 0);
  }

  private collect(shape: Shape, result: Shape[]): void {
    result.push(shape);
    for (const child of shape.getChildren()) {
      this.collect(child, result);
    }
  }

  private ensureSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new AppError("canvas width and height must be positive");
    }
  }
}
