import * as path from "path";
import * as fsp from "fs/promises";
import { smaDecrypt } from "../patchRom/sma";

const SMA_PATH = "./rom/ka.neo-sma";
const P1_PATH = "./rom/251-p1.p1";
const P2_PATH = "./rom/251-p2.p2";

async function main() {
  const smaData = Array.from(await fsp.readFile(path.resolve(SMA_PATH)));
  const p1Data = Array.from(await fsp.readFile(path.resolve(P1_PATH)));
  const p2Data = Array.from(await fsp.readFile(path.resolve(P2_PATH)));

  const decrypted = smaDecrypt(smaData, p1Data, p2Data);
  console.log("decrypted.length", decrypted.length);
}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e));
