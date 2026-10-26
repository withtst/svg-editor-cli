import { AppError } from "../shared/AppError.js";

export class Tokenizer {
  public tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quoted = false;
    let escaped = false;

    const characters = line.trim();
    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      if (escaped) {
        current += character;
        escaped = false;
        continue;
      }
      if (character === "\\" && quoted) {
        const next = characters[index + 1];
        if (next === '"' || next === "\\") {
          escaped = true;
          continue;
        }
        current += "\\";
        continue;
      }
      if (character === '"') {
        quoted = !quoted;
        continue;
      }
      if (/\s/.test(character) && !quoted) {
        if (current.length > 0) {
          tokens.push(current);
          current = "";
        }
        continue;
      }
      current += character;
    }

    if (escaped) {
      current += "\\";
    }
    if (quoted) {
      throw new AppError("unterminated quoted argument");
    }
    if (current.length > 0) {
      tokens.push(current);
    }
    return tokens;
  }
}
