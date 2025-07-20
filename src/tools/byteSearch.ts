import * as path from "path";
import * as fsp from "fs/promises";

function flipBytes(data: number[]): number[] {
  for (let i = 0; i < data.length; i += 2) {
    const byte = data[i];
    data[i] = data[i + 1];
    data[i + 1] = byte;
  }

  return data;
}

async function main(filePath: string, bytes: number[]) {
  console.log("bytes number", bytes);
  console.log(
    "bytes hex",
    bytes.map((b) => b.toString(16))
  );
  const buffer = await fsp.readFile(filePath);
  const data = flipBytes(Array.from(buffer));

  let matchCount = 0;

  for (let i = 0; i < data.length - bytes.length; ++i) {
    let match = true;
    for (let b = 0; b < bytes.length; ++b) {
      if (bytes[b] !== data[i + b]) {
        match = false;
        break;
      }
    }

    if (match) {
      matchCount += 1;
      console.log("match found at", i.toString(16));
    }
  }

  console.log({ matchCount });
}

const [_tsnode, _byteSearch, filePath, ...byteStrings] = process.argv;

if (!filePath) {
  console.error("usage: ts-node byteSearch.ts <file-path> ...bytes");
  process.exit(1);
}

const bytes = byteStrings.map((bs) => {
  return parseInt(bs, 16);
});

main(path.resolve(filePath), bytes)
  .then(() => console.log("done"))
  .catch((e) => console.error(e));
