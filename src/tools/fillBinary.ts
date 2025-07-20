
import * as path from "path";
import * as fsp from "fs/promises";


async function main(filePath: string, byte: number) {
  const buffer = await fsp.readFile(filePath);
  const data = Array.from(buffer);

  for (let i = 0; i < data.length; ++i) {
    data[i] = byte;
  }

  const writeBuffer = Uint8Array.from(data);

  await fsp.
}

const [_tsnode, _fillBinary, filePath, byteString] = process.argv;

if (!filePath) {
  console.error("usage: ts-node fillBinary.ts <file-path> <byte>");
  process.exit(1);
}

const byte = parseInt(byteString, 16);

main(path.resolve(filePath), byte)
  .then(() => console.log("done"))
  .catch((e) => console.error(e));
