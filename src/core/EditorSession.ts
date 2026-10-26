import { AppError } from "../shared/AppError.js";
import type { Command } from "./Command.js";
import { CommandHistory } from "./CommandHistory.js";
import { SvgDocument } from "../model/SvgDocument.js";

export class EditorSession {
  private document: SvgDocument | null = null;
  private filePath: string | null = null;
  private readonly history = new CommandHistory();
  private ioLocked = false;

  public getDocument(): SvgDocument | null {
    return this.document;
  }

  public requireDocument(): SvgDocument {
    if (this.document === null) {
      throw new AppError("no document. use 'init' or 'read' first");
    }
    return this.document;
  }

  public getFilePath(): string | null {
    return this.filePath;
  }

  public setFilePath(filePath: string): void {
    this.filePath = filePath;
  }

  public replaceDocument(document: SvgDocument, filePath: string | null): void {
    this.document = document;
    this.filePath = filePath;
    this.history.clear();
    this.ioLocked = true;
  }

  public markIoCommand(resetHistory = false): void {
    if (resetHistory) {
      this.history.clear();
    }
    this.ioLocked = true;
  }

  public executeEdit(command: Command): string {
    this.requireDocument();
    this.ioLocked = false;
    return this.history.execute(command);
  }

  public undo(): string {
    this.requireDocument();
    if (this.ioLocked) {
      throw new AppError("undo not allowed after io command");
    }
    try {
      return this.history.undo();
    } catch (error) {
      if (error instanceof Error && error.message === "nothing to undo") {
        throw new AppError("nothing to undo");
      }
      throw error;
    }
  }

  public redo(): string {
    this.requireDocument();
    if (this.ioLocked) {
      throw new AppError("redo not allowed after io command");
    }
    try {
      return this.history.redo();
    } catch (error) {
      if (error instanceof Error && error.message === "nothing to redo") {
        throw new AppError("nothing to redo");
      }
      throw error;
    }
  }
}
