import assert from "node:assert";
import { FillWordPatch } from "./types";

function doFillWordPatch(patch: FillWordPatch, promData: number[]): number[] {
  assert(
    promData.length === 8 * 0x100000,
    "doFillWordPatch: incoming promData is not 8mb"
  );

  const filler = parseInt(patch.fillerWord, 16);

  assert(
    filler >= 0 && filler < 2 ** 16,
    "doFillWordPatch: fillerWord out of range"
  );

  assert((patch.size & 1) === 0, "doFillWordPatch: size must be even");

  const fillData = new Array(patch.size);

  for (let i = 0; i < fillData.length; i += 2) {
    fillData[i] = filler >> 8;
    fillData[i + 1] = filler & 0xff;
  }

  const before = promData.slice(0, patch.address);
  const after = promData.slice(patch.address + patch.size);

  const result = before.concat(fillData, after);

  assert(
    result.length === 8 * 0x100000,
    "doFillWordPatch: resulting binary is not 8mb"
  );

  return result;
}

export { doFillWordPatch };
