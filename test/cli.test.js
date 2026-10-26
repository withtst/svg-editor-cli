import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CommandDispatcher } from "../dist/index.js";

function run(dispatcher, line) {
  const result = dispatcher.executeLine(line);
  return result.output.join("\n");
}

test("creates, edits, groups, and undoes SVG shapes", () => {
  const dispatcher = new CommandDispatcher();
  assert.equal(run(dispatcher, "init 400 200"), "canvas 400x200 created");
  assert.equal(run(dispatcher, "create g flow"), "g#flow created");
  assert.equal(
    run(dispatcher, "create rect start 30 70 120 60 #4a90d9 in flow"),
    "rect#start created in g#flow",
  );
  assert.equal(run(dispatcher, 'create text label 40 100 "开始" in flow'), "text#label created in g#flow");
  assert.equal(run(dispatcher, "move flow 10 20"), "g#flow moved by (10,20)");
  assert.match(run(dispatcher, "tree"), /rect#start  x=40 y=90 w=120 h=60/);
  assert.match(run(dispatcher, "undo"), /moved back/);
  assert.match(run(dispatcher, "tree"), /rect#start  x=30 y=70/);
  assert.match(run(dispatcher, "redo"), /moved by/);
  assert.equal(run(dispatcher, 'set label text "开始 v2"'), 'text#label updated: text="开始 v2"');
  assert.match(run(dispatcher, "undo"), /text="开始"/);

  assert.equal(run(dispatcher, "create circle c 50 50 10 red"), "circle#c created");
  assert.equal(run(dispatcher, "group cluster c flow"), "g#cluster created with 2 children");
  assert.match(run(dispatcher, "tree"), /g#cluster[\s\S]*g#flow[\s\S]*circle#c/);
  assert.match(run(dispatcher, "undo"), /children restored/);
  assert.match(run(dispatcher, "redo"), /created with 2 children/);
  assert.equal(run(dispatcher, "create g root"), "g#root created");
  assert.equal(run(dispatcher, "addto root cluster"), "g#cluster moved into g#root");
  assert.equal(run(dispatcher, "ungroup cluster"), "g#cluster ungrouped");
  assert.match(run(dispatcher, "undo"), /g#cluster restored/);
});

test("enforces error messages and redo invalidation", () => {
  const dispatcher = new CommandDispatcher();
  run(dispatcher, "init");
  run(dispatcher, "create rect r 1 2 3 4");
  assert.equal(run(dispatcher, "create rect r 1 2 3 4"), "error: id already exists: r");
  assert.equal(run(dispatcher, "scale r 0"), "error: scale factor must be positive");
  assert.equal(run(dispatcher, "set r opacity 0.5"), "error: unknown attribute: opacity");
  run(dispatcher, "move r 10 0");
  run(dispatcher, "undo");
  run(dispatcher, "create circle c 10 10 2");
  assert.equal(run(dispatcher, "redo"), "error: nothing to redo");
  assert.equal(run(dispatcher, "delete missing"), "error: no such shape: missing");
});

test("round-trips SVG and assigns ids to unnamed elements", () => {
  const directory = mkdtempSync(join(tmpdir(), "svg-editor-"));
  try {
    const input = join(directory, "input.svg");
    const output = join(directory, "output.svg");
    writeFileSync(
      input,
      `<?xml version="1.0"?>\n<svg width="400" height="300" viewBox="0 0 400 300">\n  <rect x="0" y="0" width="400" height="300" fill="#fff"/>\n  <g id="scene"><circle id="c1" cx="50" cy="50" r="10"/></g>\n  <text id="title" x="10" y="290">imported &amp; ready</text>\n</svg>`,
    );
    const dispatcher = new CommandDispatcher();
    assert.equal(run(dispatcher, `read "${input}"`).split("\n")[0], "warning: assigned id rect1 to unnamed <rect>");
    assert.match(run(dispatcher, "tree"), /rect#rect1/);
    assert.match(run(dispatcher, "tree"), /imported & ready/);
    assert.match(run(dispatcher, `save "${output}"`), /saved to/);
    assert.match(readFileSync(output, "utf8"), /id="rect1"/);
    assert.equal(run(dispatcher, "undo"), "error: undo not allowed after io command");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
