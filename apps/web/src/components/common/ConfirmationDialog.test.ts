import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ConfirmationDialog builds the shared destructive confirmation surface on top of Overlay", () => {
  const source = readFileSync(
    new URL("./ConfirmationDialog.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Overlay/);
  assert.match(source, /surface="plain"/);
  assert.match(source, /Message/);
  assert.match(source, /color="blood"/);
  assert.match(source, /confirmLabel/);
  assert.match(source, /cancelLabel/);
  assert.match(source, /confirmColor/);
  assert.match(source, /onConfirm/);
  assert.match(source, /onClose/);
  assert.match(source, /PendingIndicator/);
  assert.match(source, /confirmation-dialog/);
});
