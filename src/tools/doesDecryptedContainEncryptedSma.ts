import assert from "node:assert";
import fsp from "node:fs/promises";

async function main() {
  const decrypted = Array.from(
    await fsp.readFile(
      "/home/matt/dev/kof99v/src/promEncryption/src/p1_decrypted"
    )
  );
  const esma = Array.from(
    await fsp.readFile("/home/matt/dev/kof99v/rom/ka.neo-sma")
  );

  const esmaFromDecrypted = decrypted.slice(0xc0000, 0xc0000 + 0x40000);

  assert(esma.length === esmaFromDecrypted.length, "lengths differ");
  console.log("esma.length", esma.length, esmaFromDecrypted.length);

  for (let i = 0; i < esma.length; ++i) {
    assert(esma[i] === esmaFromDecrypted[i], `bytes differ at ${i}`);
  }
}

main().then(() => {
  console.log("done");
});
