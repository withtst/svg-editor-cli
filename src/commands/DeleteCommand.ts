import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class DeleteCommand extends DocumentCommand implements Command {
  private shape: Shape | null = null;
  private parent: GroupShape | null = null;
  private index = 0;

  public constructor(document: SvgDocument, private readonly id: string) {
    super(document);
  }

  public execute(): string {
    if (this.shape === null) {
      this.shape = this.shapeById(this.id);
    }
    const location = this.document.detachShape(this.shape);
    this.parent = location.parent;
    this.index = location.index;
    return `${this.shape.getDisplayName()} deleted`;
  }

  public undo(): string {
    if (this.shape === null) {
      throw new Error("delete command has no shape");
    }
    this.document.attachShape(this.shape, this.parent, this.index);
    const parent = this.parent?.getDisplayName() ?? "svg";
    return `${this.shape.getDisplayName()} restored into ${parent}`;
  }
}
