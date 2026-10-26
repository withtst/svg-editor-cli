import { AppError } from "../shared/AppError.js";
import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class AddToCommand extends DocumentCommand implements Command {
  private target: Shape | null = null;
  private container: GroupShape | null = null;
  private oldParent: GroupShape | null = null;
  private oldIndex = 0;

  public constructor(document: SvgDocument, private readonly groupId: string, private readonly shapeId: string) {
    super(document);
  }

  public execute(): string {
    if (this.target === null || this.container === null) {
      this.target = this.shapeById(this.shapeId);
      this.container = this.containerById(this.groupId);
      if (this.target === this.container || this.document.isDescendantOf(this.container, this.target as GroupShape)) {
        throw new AppError(`cannot add a container to its own descendant: ${this.shapeId}`);
      }
      this.oldParent = this.target.getParent();
      this.oldIndex = this.oldParent?.indexOf(this.target) ?? this.document.getChildren().indexOf(this.target);
    }

    this.document.detachShape(this.target);
    this.container.addChild(this.target);
    return `${this.target.getDisplayName()} moved into ${this.container.getDisplayName()}`;
  }

  public undo(): string {
    if (this.target === null) {
      throw new Error("addto command has no target");
    }
    this.document.detachShape(this.target);
    this.document.attachShape(this.target, this.oldParent, this.oldIndex);
    return `${this.target.getDisplayName()} moved back`;
  }
}
