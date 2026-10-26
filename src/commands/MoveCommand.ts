import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class MoveCommand extends DocumentCommand implements Command {
  public constructor(
    document: SvgDocument,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super(document);
  }

  public execute(): string {
    const shape = this.shapeById(this.id);
    shape.move(this.dx, this.dy);
    return this.message(shape, false);
  }

  public undo(): string {
    const shape = this.shapeById(this.id);
    shape.move(-this.dx, -this.dy);
    return this.message(shape, true);
  }

  private message(shape: ReturnType<MoveCommand["shapeById"]>, back: boolean): string {
    const prefix = back ? "moved back" : "moved";
    if (shape.isContainer()) {
      const dx = back ? -this.dx : this.dx;
      const dy = back ? -this.dy : this.dy;
      return `${shape.getDisplayName()} ${prefix} by (${dx},${dy})`;
    }
    const position = this.positionOf(shape);
    return position === null
      ? `${shape.getDisplayName()} ${prefix}`
      : `${shape.getDisplayName()} ${back ? "moved back to" : "moved to"} (${position.x},${position.y})`;
  }
}
