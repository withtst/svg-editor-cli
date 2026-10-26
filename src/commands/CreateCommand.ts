import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class CreateCommand extends DocumentCommand implements Command {
  private index: number | undefined;

  public constructor(
    document: SvgDocument,
    private readonly shape: Shape,
    private readonly parent: GroupShape | null,
  ) {
    super(document);
  }

  public execute(): string {
    this.document.attachShape(this.shape, this.parent, this.index);
    const location = this.parent?.indexOf(this.shape) ?? this.document.getChildren().indexOf(this.shape);
    this.index = location;
    return this.parent === null
      ? `${this.shape.getDisplayName()} created`
      : `${this.shape.getDisplayName()} created in ${this.parent.getDisplayName()}`;
  }

  public undo(): string {
    this.document.detachShape(this.shape);
    return `${this.shape.getDisplayName()} deleted`;
  }
}
