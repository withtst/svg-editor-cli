export class HelpRenderer {
  public render(): string {
    return [
      "init [w] [h]                         new document (default 800x600)",
      "read <file.svg>                      read an SVG document",
      "save [file.svg]                      save the current document",
      "canvas [w] [h]                      show or change canvas size",
      "create <type> <id> [params...]       create rect/circle/ellipse/line/text/g",
      "  ... in <containerId>               create directly inside a group",
      "delete <id>                          delete a shape or its subtree",
      "move <id> <dx> <dy>                 move a shape or group",
      "scale <id> <factor>                 scale a shape or group",
      "set <id> <attr> <value>             set a whitelisted attribute",
      "group <newGid> <id1> <id2>...       group existing shapes",
      "ungroup <gid>                       dissolve a non-composite group",
      "addto <gid> <id>                    move an existing shape into a group",
      "front <id> / back <id>              change z-order within the parent",
      "tree [id]                           show the structure tree",
      "show <id>                           show shape attributes",
      "undo / redo                         edit history",
      "help                                show this help",
      "quit                                exit the CLI",
    ].join("\n");
  }
}
