import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class SetAttributeCommand extends DocumentCommand implements Command {
  private target: Shape | null = null;
  private previousValue: string | undefined;
  private executed = false;

  public constructor(
    document: SvgDocument,
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: string,
  ) {
    super(document);
  }

  public execute(): string {
    this.target ??= this.shapeById(this.id);
    if (!this.executed) {
      this.previousValue = this.target.getAttribute(this.attribute);
    }
    this.target.setAttribute(this.attribute, this.value);
    this.executed = true;
    return `${this.target.getDisplayName()} updated: ${this.attribute}=${this.displayValue(this.value)}`;
  }

  public undo(): string {
    if (this.target === null) {
      throw new Error("set command has no target");
    }
    this.target.restoreAttribute(this.attribute, this.previousValue);
    return this.previousValue === undefined
      ? `${this.target.getDisplayName()} restored: ${this.attribute} removed`
      : `${this.target.getDisplayName()} restored: ${this.attribute}=${this.displayValue(this.previousValue)}`;
  }

  private displayValue(value: string): string {
    return this.attribute === "text" ? `"${value}"` : value;
  }
}
