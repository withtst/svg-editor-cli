import { readFileSync, writeFileSync } from "node:fs";
import { AppError } from "../shared/AppError.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { SvgParser, ParsedSvg } from "./SvgParser.js";
import { SvgSerializer } from "./SvgSerializer.js";

export class FileService {
  public constructor(
    private readonly parser = new SvgParser(),
    private readonly serializer = new SvgSerializer(),
  ) {}

  public read(path: string): ParsedSvg {
    try {
      return this.parser.parse(readFileSync(path, "utf8"));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`cannot read file: ${path}`);
    }
  }

  public write(path: string, document: SvgDocument): void {
    try {
      writeFileSync(path, this.serializer.serialize(document), "utf8");
    } catch {
      throw new AppError(`cannot write file: ${path}`);
    }
  }

  public serialize(document: SvgDocument): string {
    return this.serializer.serialize(document);
  }
}
