import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class ZOrderCommand extends DocumentCommand implements Command {
  private shape: Shape | null = null;
  private parent: GroupShape | null = null;
  private oldIndex = 0;

  public constructor(
    document: SvgDocument,
    private readonly id: string,
    private readonly direction: "front" | "back",
  ) {
    super(document);
  }

  public execute(): string {
    if (this.shape === null) {
      this.shape = this.shapeById(this.id);
      this.parent = this.shape.getParent();
      this.oldIndex = this.parent?.indexOf(this.shape) ?? this.document.getChildren().indexOf(this.shape);
    }

    this.document.detachShape(this.shape);
    const lastIndex = this.parent?.getChildren().length ?? this.document.getChildren().length;
    this.document.attachShape(this.shape, this.parent, this.direction === "front" ? lastIndex : 0);
    return `${this.shape.getDisplayName()} moved to ${this.direction}`;
  }

  public undo(): string {
    if (this.shape === null) {
      throw new Error("z-order command has no shape");
    }
    this.document.detachShape(this.shape);
    this.document.attachShape(this.shape, this.parent, this.oldIndex);
    return `${this.shape.getDisplayName()} z-order restored`;
  }
}
