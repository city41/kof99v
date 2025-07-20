import path from "node:path";
import fsp from "node:fs/promises";
import * as mkdirp from "mkdirp";
import { execSync } from "node:child_process";
import {
  P1_FILE_NAME,
  P2_FILE_NAME,
  SMA_FILE_NAME,
  asmTmpDir,
  romTmpDir,
  tmpDir,
} from "./dirs";
import {
  AddressPromFilePathPatch,
  AddressPromPatch,
  RomFileBuffer,
  InlinePatch,
  Patch,
  PatchJSON,
  StringPromPatch,
  AddressPromFileAvatarPathPatch,
  FillWordPatch,
} from "./types";
import { doPromPatch } from "./doPromPatch";
import { doFillWordPatch } from "./doFillWordPatch";
import { smaDecrypt, smaEncrypt } from "./sma";

function usage() {
  console.error(
    "usage: ts-node src/patchRom/main.ts <a94 or a95> <patch-jsons...>"
  );
  process.exit(1);
}

async function getEntireDecryptedProm(zipPath: string): Promise<number[]> {
  const cmd = `unzip -o ${zipPath} -d ${romTmpDir}`;
  const cwd = path.resolve();
  console.log("About to do", cmd, "in", cwd);
  const output = execSync(cmd, { cwd });
  console.log(output.toString());

  const smaData = Array.from(
    await fsp.readFile(path.resolve(romTmpDir, SMA_FILE_NAME))
  );
  const p1Data = Array.from(
    await fsp.readFile(path.resolve(romTmpDir, P1_FILE_NAME))
  );
  const p2Data = Array.from(
    await fsp.readFile(path.resolve(romTmpDir, P2_FILE_NAME))
  );

  return smaDecrypt(smaData, p1Data, p2Data);
}

function flipBytes(data: number[]): number[] {
  for (let i = 0; i < data.length; i += 2) {
    const byte = data[i];
    data[i] = data[i + 1];
    data[i + 1] = byte;
  }

  return data;
}

function isFillWordPatch(obj: unknown): obj is FillWordPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as FillWordPatch;

  return (
    p.type === "prom-fill-word" &&
    typeof p.fillerWord === "string" &&
    typeof p.address === "number" &&
    typeof p.size === "number"
  );
}

function isStringPatch(obj: unknown): obj is StringPromPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as StringPromPatch;

  return p.type === "prom" && p.string === true && typeof p.value === "string";
}

function isAddressPatch(obj: unknown): obj is AddressPromPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as AddressPromPatch;

  return p.type === "prom" && Array.isArray(p.patchAsm);
}

function isAddressFileAvatarPathPatch(
  obj: unknown
): obj is AddressPromFileAvatarPathPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as AddressPromFileAvatarPathPatch;

  return (
    p.type === "prom" &&
    typeof p.a94PatchAsm === "string" &&
    typeof p.a95PatchAsm === "string"
  );
}

function isAddressFilePathPatch(obj: unknown): obj is AddressPromFilePathPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as AddressPromPatch;

  return p.type === "prom" && typeof p.patchAsm === "string";
}

function isPatch(obj: unknown): obj is Patch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as Patch;

  return (
    isStringPatch(p) ||
    isAddressPatch(p) ||
    (isAddressFilePathPatch(p) && !isAddressFileAvatarPathPatch(p)) ||
    (isAddressFileAvatarPathPatch(p) && !isAddressFilePathPatch(p)) ||
    isFillWordPatch(p)
  );
}

function isPatchJSON(obj: unknown): obj is PatchJSON {
  if (!obj) {
    return false;
  }

  if (Array.isArray(obj)) {
    return false;
  }

  const p = obj as PatchJSON;

  if (typeof p.description !== "string") {
    return false;
  }

  if (!Array.isArray(p.patches)) {
    return false;
  }

  return p.patches.every((patch) => {
    if (isPatch(patch)) {
      return true;
    } else {
      console.error(
        "not a valid patch\n\n",
        JSON.stringify(patch, null, 2),
        "\n\n"
      );
      return false;
    }
  });
}

async function writePatchedZip(
  p1Data: number[],
  p2Data: number[],
  cromBuffers: RomFileBuffer[],
  // fixBuffer: RomFileBuffer,
  outputPath: string
): Promise<void> {
  await fsp.writeFile(
    path.resolve(romTmpDir, P1_FILE_NAME),
    new Uint8Array(p1Data)
  );

  await fsp.writeFile(
    path.resolve(romTmpDir, P2_FILE_NAME),
    new Uint8Array(p2Data)
  );

  // await fsp.writeFile(
  //   path.resolve(romTmpDir, SROM_FILE_NAME),
  //   new Uint8Array(fixBuffer.data)
  // );

  for (const cromBuffer of cromBuffers) {
    await fsp.writeFile(
      path.resolve(romTmpDir, cromBuffer.fileName),
      new Uint8Array(cromBuffer.data)
    );
  }

  const cmd = "zip kof99.zip *";
  console.log("about to execute", cmd, "in", romTmpDir);
  const output = execSync(cmd, { cwd: romTmpDir });
  console.log(output.toString());

  const cpCmd = `cp kof99.zip ${outputPath}`;
  console.log("about to execute", cpCmd, "in", romTmpDir);
  const output2 = execSync(cpCmd, { cwd: romTmpDir });
  console.log(output2.toString());
}

async function hydratePatch(
  patch: Patch,
  jsonDir: string
): Promise<InlinePatch> {
  if (isStringPatch(patch) || isAddressPatch(patch)) {
    return patch;
  } else if (isAddressFilePathPatch(patch)) {
    const asmPath = path.resolve(jsonDir, patch.patchAsm);
    const asmString = (await fsp.readFile(asmPath)).toString();

    return {
      ...patch,
      patchAsm: asmString.split("\n"),
    };
  } else {
    throw new Error(`unexpected patch: ${JSON.stringify(patch)}`);
  }
}

function loadInitialSymbols(
  initialSymbols: Record<string, string> | undefined
): Record<string, number> {
  if (!initialSymbols) {
    return {};
  }

  return Object.entries(initialSymbols).reduce<Record<string, number>>(
    (accum, entry) => {
      return {
        ...accum,
        [entry[0]]: parseInt(entry[1], 16),
      };
    },
    {}
  );
}

async function main(patchJsonPaths: string[]) {
  try {
    await fsp.rm(tmpDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 1000,
    });
    mkdirp.sync(romTmpDir);
    mkdirp.sync(asmTmpDir);

    const flippedPromBuffer = await getEntireDecryptedProm(
      path.resolve("./kof99.zip")
    );
    const flippedPromData = Array.from(flippedPromBuffer);
    const promData = flipBytes(flippedPromData);

    // the prom data inside the decrypted bundle starts 1mb in
    // later it's important to reattach the starting meg during decryption
    let patchedPromData = promData.slice(0x100000);

    for (const patchJsonPath of patchJsonPaths) {
      const jsonDir = path.dirname(patchJsonPath);
      console.log("Starting patch", patchJsonPath);

      let patchJson: unknown;
      try {
        patchJson = require(patchJsonPath);
      } catch (e) {
        console.error("Error occured loading the patch", e);
      }

      if (!isPatchJSON(patchJson)) {
        console.error(
          "The JSON at",
          patchJsonPath,
          ", is not a valid patch file"
        );
        usage();
      } else {
        console.log("patch json", JSON.stringify(patchJson, null, 2));
        if (
          patchJson.patches.some(
            (p) => isAddressPatch(p) && p.subroutine == true
          ) &&
          !patchJson.subroutineSpace
        ) {
          console.error(
            "This patch contains subroutine patches, but did not specify subroutineSpace"
          );
          process.exit(1);
        }

        let symbolTable: Record<string, number> = loadInitialSymbols(
          patchJson.symbols
        );
        const subroutineInsertStart = patchJson.subroutineSpace?.start
          ? parseInt(patchJson.subroutineSpace.start, 16)
          : 0;
        let subroutineInsertEnd = patchJson.subroutineSpace?.end
          ? parseInt(patchJson.subroutineSpace.end, 16)
          : 0;

        console.log(patchJson.description);

        for (const patch of patchJson.patches) {
          if (patch.skip) {
            console.log("SKIPPING!", patch.description ?? "(unknown)");
            continue;
          }
          console.log("next patch", patch.description ?? "(unknown)");

          try {
            if (isFillWordPatch(patch)) {
              patchedPromData = doFillWordPatch(patch, patchedPromData);
            } else {
              const hydratedPatch = await hydratePatch(patch, jsonDir);
              const result = await doPromPatch(
                symbolTable,
                patchedPromData,
                subroutineInsertEnd,
                hydratedPatch
              );
              patchedPromData = result.patchedPromData;
              subroutineInsertEnd = result.subroutineInsertEnd;
              symbolTable = result.symbolTable;
            }

            if (
              !!patchJson.subroutineSpace &&
              subroutineInsertEnd < subroutineInsertStart
            ) {
              throw new Error("patch used up all of the subroutine space");
            }
          } catch (e) {
            console.error(e);
            process.exit(1);
          }

          console.log("\n\n");
        }
        console.log(
          `after patching, ${
            subroutineInsertEnd - subroutineInsertStart
          } bytes left for subroutines`
        );

        console.log("final symbols");
        for (const entry of Object.entries(symbolTable)) {
          console.log(entry[0], entry[1].toString(16));
        }
      }
    }

    const flippedBackPromData = flipBytes(patchedPromData);
    const startingMeg = flippedPromData.slice(0, 0x100000);
    const fullPromBundleAfterPatch = startingMeg.concat(flippedBackPromData);
    const reencrypted = smaEncrypt(fullPromBundleAfterPatch);

    const mameDir = process.env.MAME_ROM_DIR;

    if (!mameDir?.trim()) {
      throw new Error("MAME_ROM_DIR env variable is not set");
    }

    // const cromBuffers = await injectCromTiles();
    // const finalCromBuffers = await injectTitleBadgeTiles(cromBuffers);
    // const fixBuffer = await clearFixTiles();

    const finalCromBuffers: RomFileBuffer[] = [];

    const writePath = path.resolve(mameDir, "kof99.zip");
    await writePatchedZip(
      reencrypted.p1,
      reencrypted.p2,
      finalCromBuffers,
      // fixBuffer,
      writePath
    );

    console.log("wrote patched rom to", writePath);
  } catch (e) {
    console.error(e);
  }
}

const [_tsNode, _main, ...patchJsonInputPaths] = process.argv;

const finalPatchJsonPaths = patchJsonInputPaths.map((pjip) =>
  path.resolve(process.cwd(), pjip)
);

main(finalPatchJsonPaths).catch((e) => console.error);

export { isStringPatch };
