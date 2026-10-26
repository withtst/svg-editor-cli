import type { Command } from "./Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  public execute(command: Command): string {
    const result = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    return result;
  }

  public undo(): string {
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new Error("nothing to undo");
    }
    try {
      const result = command.undo();
      this.redoStack.push(command);
      return result;
    } catch (error) {
      this.undoStack.push(command);
      throw error;
    }
  }

  public redo(): string {
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new Error("nothing to redo");
    }
    try {
      const result = command.execute();
      this.undoStack.push(command);
      return result;
    } catch (error) {
      this.redoStack.push(command);
      throw error;
    }
  }

  public clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
