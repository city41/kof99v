import path from "node:path";
import fsp from "node:fs/promises";
import execa from "execa";
import * as mkdirp from "mkdirp";
import { progCTmpDir } from "./dirs";

type ProgCEncryptResult = {
  sma: number[];
  p1: number[];
  p2: number[];
};

const BIN = "promEncryptDecrypt";

async function progCEncrypt(
  promDecryptedBundle: number[]
): Promise<ProgCEncryptResult> {
  mkdirp.sync(progCTmpDir);
  console.log({ progCTmpDir });

  await fsp.writeFile(
    path.resolve(progCTmpDir, "p1_decrypted"),
    new Uint8Array(promDecryptedBundle)
  );
  await fsp.copyFile(
    path.resolve("/home/matt/dev/kof99v/src/promEncryption/src/", BIN),
    path.resolve(progCTmpDir, BIN)
  );

  const result = await execa(`./${BIN}`, ["e"], { cwd: progCTmpDir });

  console.log(result.stdout);

  const smaBuffer = await fsp.readFile(path.resolve(progCTmpDir, "sma"));
  const p1Buffer = await fsp.readFile(path.resolve(progCTmpDir, "p1"));
  const p2Buffer = await fsp.readFile(path.resolve(progCTmpDir, "p2"));

  return {
    sma: Array.from(smaBuffer),
    p1: Array.from(p1Buffer),
    p2: Array.from(p2Buffer),
  };
}

export { progCEncrypt };
