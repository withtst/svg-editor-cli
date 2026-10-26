import { AppError } from "../shared/AppError.js";
import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class UngroupCommand extends DocumentCommand implements Command {
  private group: GroupShape | null = null;
  private parent: GroupShape | null = null;
  private index = 0;
  private children: Shape[] = [];

  public constructor(document: SvgDocument, private readonly id: string) {
    super(document);
  }

  public execute(): string {
    if (this.group === null) {
      const shape = this.shapeById(this.id);
      if (!(shape instanceof GroupShape)) {
        throw new AppError(`not a container: ${this.id}`);
      }
      if (shape.isComposite()) {
        throw new AppError(`cannot ungroup composite shape: ${this.id}`);
      }
      this.group = shape;
      this.parent = shape.getParent();
      if (this.parent === null) {
        throw new AppError(`cannot ungroup top-level container: ${this.id}`);
      }
      this.index = this.parent.indexOf(shape);
      this.children = [...shape.getChildren()];
    }

    this.document.detachShape(this.group);
    for (const child of this.children) {
      this.group.removeChild(child);
    }
    for (let offset = 0; offset < this.children.length; offset += 1) {
      this.document.attachShape(this.children[offset], this.parent, this.index + offset);
    }
    return `${this.group.getDisplayName()} ungrouped`;
  }

  public undo(): string {
    if (this.group === null || this.parent === null) {
      throw new Error("ungroup command has no group");
    }

    for (const child of this.children) {
      this.document.detachShape(child);
    }
    this.document.attachShape(this.group, this.parent, this.index);
    for (const child of this.children) {
      this.group.addChild(child);
    }
    return `${this.group.getDisplayName()} restored`;
  }
}
