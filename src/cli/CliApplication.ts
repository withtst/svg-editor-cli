import { createInterface } from "node:readline";
import { CommandDispatcher } from "./CommandDispatcher.js";

export class CliApplication {
  public constructor(private readonly dispatcher = new CommandDispatcher()) {}

  public run(): void {
    const readline = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    console.log("svg-editor 0.1 — type 'help' for commands");
    readline.setPrompt("svg> ");
    readline.prompt();
    readline.on("line", (line) => {
      const result = this.dispatcher.executeLine(line);
      for (const output of result.output) {
        console.log(output);
      }
      if (result.exit) {
        readline.close();
        return;
      }
      readline.prompt();
    });
  }
}
