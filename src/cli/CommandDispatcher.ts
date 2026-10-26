import { resolve } from "node:path";
import { AppError } from "../shared/AppError.js";
import { EditorSession } from "../core/EditorSession.js";
import { ShapeFactory } from "../core/ShapeFactory.js";
import { AddToCommand } from "../commands/AddToCommand.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetAttributeCommand } from "../commands/SetAttributeCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { ZOrderCommand } from "../commands/ZOrderCommand.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { parseNumber } from "../model/ValueFormatter.js";
import { FileService } from "../io/FileService.js";
import { HelpRenderer } from "./HelpRenderer.js";
import { ShowRenderer } from "./ShowRenderer.js";
import { Tokenizer } from "./Tokenizer.js";
import { TreeRenderer } from "./TreeRenderer.js";

export interface DispatchResult {
  output: string[];
  exit: boolean;
}

type Handler = (args: string[]) => string[];

export class CommandDispatcher {
  private readonly handlers = new Map<string, Handler>();
  private readonly tokenizer = new Tokenizer();
  private readonly treeRenderer = new TreeRenderer();
  private readonly showRenderer = new ShowRenderer();
  private readonly helpRenderer = new HelpRenderer();

  public constructor(
    private readonly session = new EditorSession(),
    private readonly factory = new ShapeFactory(),
    private readonly fileService = new FileService(),
  ) {
    this.registerHandlers();
  }

  public executeLine(line: string): DispatchResult {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      return { output: [], exit: false };
    }

    try {
      const tokens = this.tokenizer.tokenize(trimmed);
      const commandName = tokens.shift()?.toLowerCase();
      if (commandName === undefined) {
        return { output: [], exit: false };
      }
      if (commandName === "quit" || commandName === "exit") {
        return { output: [], exit: true };
      }
      const handler = this.handlers.get(commandName);
      if (handler === undefined) {
        throw new AppError(`unknown command: ${commandName}`);
      }
      return { output: handler(tokens), exit: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { output: [`error: ${message}`], exit: false };
    }
  }

  public getSession(): EditorSession {
    return this.session;
  }

  private registerHandlers(): void {
    this.handlers.set("init", (args) => this.init(args));
    this.handlers.set("read", (args) => this.read(args));
    this.handlers.set("save", (args) => this.save(args));
    this.handlers.set("canvas", (args) => this.canvas(args));
    this.handlers.set("create", (args) => this.create(args));
    this.handlers.set("delete", (args) => this.delete(args));
    this.handlers.set("move", (args) => this.move(args));
    this.handlers.set("scale", (args) => this.scale(args));
    this.handlers.set("set", (args) => this.setAttribute(args));
    this.handlers.set("group", (args) => this.group(args));
    this.handlers.set("ungroup", (args) => this.ungroup(args));
    this.handlers.set("addto", (args) => this.addto(args));
    this.handlers.set("front", (args) => this.zOrder(args, "front"));
    this.handlers.set("back", (args) => this.zOrder(args, "back"));
    this.handlers.set("tree", (args) => this.tree(args));
    this.handlers.set("show", (args) => this.show(args));
    this.handlers.set("help", (args) => this.help(args));
    this.handlers.set("undo", (args) => this.undo(args));
    this.handlers.set("redo", (args) => this.redo(args));
  }

  private init(args: string[]): string[] {
    this.ensureCount("init", args, 0, 2);
    const width = args[0] === undefined ? 800 : parseNumber(args[0], "width");
    const height = args[1] === undefined ? 600 : parseNumber(args[1], "height");
    const document = new SvgDocument(width, height);
    this.session.replaceDocument(document, null);
    return [`canvas ${width}x${height} created`];
  }

  private read(args: string[]): string[] {
    this.ensureCount("read", args, 1, 1);
    const inputPath = args[0];
    const path = resolve(inputPath);
    let parsed;
    try {
      parsed = this.fileService.read(path);
    } catch {
      throw new AppError(`cannot read file: ${inputPath}`);
    }
    this.session.replaceDocument(parsed.document, path);
    return [...parsed.warnings, `read ${inputPath} (${parsed.document.countElements()} elements)`];
  }

  private save(args: string[]): string[] {
    this.ensureCount("save", args, 0, 1);
    const document = this.session.requireDocument();
    const inputPath = args[0] ?? this.session.getFilePath();
    if (inputPath === null) {
      throw new AppError("no file path. use 'save <file.svg>'");
    }
    const path = resolve(inputPath);
    try {
      this.fileService.write(path, document);
    } catch {
      throw new AppError(`cannot write file: ${inputPath}`);
    }
    this.session.setFilePath(path);
    this.session.markIoCommand(false);
    return [`saved to ${inputPath} (${document.countElements()} elements)`];
  }

  private canvas(args: string[]): string[] {
    this.ensureCount("canvas", args, 0, 2);
    const document = this.session.requireDocument();
    if (args.length === 0) {
      return [`canvas ${document.width}x${document.height}`];
    }
    const width = parseNumber(args[0], "width");
    const height = parseNumber(args[1], "height");
    document.setSize(width, height);
    this.session.markIoCommand(false);
    return [`canvas ${width}x${height} updated`];
  }

  private create(args: string[]): string[] {
    if (args.length < 2) {
      throw new AppError("usage: create <type> <id> [params...]");
    }
    const document = this.session.requireDocument();
    const [type, id] = args;
    const remaining = args.slice(2);
    let parentId: string | null = null;
    const inIndex = remaining.indexOf("in");
    if (inIndex >= 0) {
      if (inIndex !== remaining.length - 2) {
        throw new AppError("usage: create ... [in <containerId>]");
      }
      parentId = remaining[inIndex + 1];
      remaining.splice(inIndex, 2);
    }
    const shape = this.factory.create(type, id, remaining);
    const parent = parentId === null ? null : this.requireContainer(document, parentId);
    return [this.session.executeEdit(new CreateCommand(document, shape, parent))];
  }

  private delete(args: string[]): string[] {
    this.ensureCount("delete", args, 1, 1);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new DeleteCommand(document, args[0]))];
  }

  private move(args: string[]): string[] {
    this.ensureCount("move", args, 3, 3);
    const document = this.session.requireDocument();
    return [
      this.session.executeEdit(
        new MoveCommand(document, args[0], parseNumber(args[1], "dx"), parseNumber(args[2], "dy")),
      ),
    ];
  }

  private scale(args: string[]): string[] {
    this.ensureCount("scale", args, 2, 2);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new ScaleCommand(document, args[0], parseNumber(args[1], "factor")))];
  }

  private setAttribute(args: string[]): string[] {
    this.ensureCount("set", args, 3, 3);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new SetAttributeCommand(document, args[0], args[1], args[2]))];
  }

  private group(args: string[]): string[] {
    if (args.length < 2) {
      throw new AppError("usage: group <newGid> <id1> <id2>...");
    }
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new GroupCommand(document, args[0], args.slice(1)))];
  }

  private ungroup(args: string[]): string[] {
    this.ensureCount("ungroup", args, 1, 1);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new UngroupCommand(document, args[0]))];
  }

  private addto(args: string[]): string[] {
    this.ensureCount("addto", args, 2, 2);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new AddToCommand(document, args[0], args[1]))];
  }

  private zOrder(args: string[], direction: "front" | "back"): string[] {
    this.ensureCount(direction, args, 1, 1);
    const document = this.session.requireDocument();
    return [this.session.executeEdit(new ZOrderCommand(document, args[0], direction))];
  }

  private tree(args: string[]): string[] {
    this.ensureCount("tree", args, 0, 1);
    return [this.treeRenderer.render(this.session.requireDocument(), args[0])];
  }

  private show(args: string[]): string[] {
    this.ensureCount("show", args, 1, 1);
    return [this.showRenderer.render(this.session.requireDocument(), args[0])];
  }

  private help(args: string[]): string[] {
    this.ensureCount("help", args, 0, 0);
    return [this.helpRenderer.render()];
  }

  private undo(args: string[]): string[] {
    this.ensureCount("undo", args, 0, 0);
    return [this.session.undo()];
  }

  private redo(args: string[]): string[] {
    this.ensureCount("redo", args, 0, 0);
    return [this.session.redo()];
  }

  private requireContainer(document: SvgDocument, id: string) {
    const shape = document.findById(id);
    if (shape === null) {
      throw new AppError(`no such container: ${id}`);
    }
    if (!shape.isContainer()) {
      throw new AppError(`not a container: ${id}`);
    }
    return shape as import("../model/GroupShape.js").GroupShape;
  }

  private ensureCount(command: string, args: string[], min: number, max: number): void {
    if (args.length < min || args.length > max) {
      throw new AppError(`invalid arguments for ${command}`);
    }
  }
}
