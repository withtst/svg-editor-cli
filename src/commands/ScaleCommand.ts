import { AppError } from "../shared/AppError.js";
import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class ScaleCommand extends DocumentCommand implements Command {
  public constructor(document: SvgDocument, private readonly id: string, private readonly factor: number) {
    super(document);
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new AppError("scale factor must be positive");
    }
  }

  public execute(): string {
    const shape = this.shapeById(this.id);
    shape.scale(this.factor);
    return `${shape.getDisplayName()} scaled by ${this.factor}`;
  }

  public undo(): string {
    const shape = this.shapeById(this.id);
    shape.scale(1 / this.factor);
    return `${shape.getDisplayName()} scale restored`;
  }
}
