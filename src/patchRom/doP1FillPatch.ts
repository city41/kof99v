import { P1FillPatch } from "./types";

const P1_SIZE = 0x400000;

function doFillP1Patch(patch: P1FillPatch): number[] {
  const filler = parseInt(patch.filler, 16);
  return new Array(P1_SIZE).fill(filler);
}

export { doFillP1Patch };
