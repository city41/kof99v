import fsp from "node:fs/promises";
import path from "node:path";
import { smaDecrypt, smaEncrypt } from "../../src/patchRom/sma";

const SMA_PATH = "./rom/ka.neo-sma";
const P1_PATH = "./rom/251-p1.p1";
const P2_PATH = "./rom/251-p2.p2";
const DECRYPTED_PROGC_PATH = "./src/promEncryption/src/p1_decrypted";

describe("sma", function () {
  describe("decryption", function () {
    it("should decrypt to the same binary as prog.c does", async function () {
      const smaData = Array.from(await fsp.readFile(path.resolve(SMA_PATH)));
      const p1Data = Array.from(await fsp.readFile(path.resolve(P1_PATH)));
      const p2Data = Array.from(await fsp.readFile(path.resolve(P2_PATH)));

      const decrypted = smaDecrypt(smaData, p1Data, p2Data);

      const decryptedFromProgC = Array.from(
        await fsp.readFile(path.resolve(DECRYPTED_PROGC_PATH))
      );

      expect(decrypted.length).toBe(decryptedFromProgC.length);

      for (let i = 0; i < decrypted.length; ++i) {
        if (decrypted[i] !== decryptedFromProgC[i]) {
          throw new Error(
            `byte at index ${i}/${decrypted.length} differs: expected(${decryptedFromProgC[i]}), actual(${decrypted[i]})`
          );
        }
      }
    });
  });

  describe("encryption", function () {
    it("should do a round trip decrypt->encrypt", async function () {
      const smaData = Array.from(await fsp.readFile(path.resolve(SMA_PATH)));
      const p1Data = Array.from(await fsp.readFile(path.resolve(P1_PATH)));
      const p2Data = Array.from(await fsp.readFile(path.resolve(P2_PATH)));

      const decrypted = smaDecrypt(smaData, p1Data, p2Data);

      const reEncryptedResult = smaEncrypt(decrypted);

      expect(reEncryptedResult.sma.length).toBe(smaData.length);
      expect(reEncryptedResult.p1.length).toBe(p1Data.length);
      expect(reEncryptedResult.p2.length).toBe(p2Data.length);

      for (let i = 0; i < reEncryptedResult.sma.length; ++i) {
        if (reEncryptedResult.sma[i] !== smaData[i]) {
          throw new Error(
            `sma byte at index ${i}/${reEncryptedResult.sma.length} differs: expected(${smaData[i]}), actual(${reEncryptedResult.sma[i]})`
          );
        }
      }

      for (let i = 0; i < reEncryptedResult.p1.length; ++i) {
        if (reEncryptedResult.p1[i] !== p1Data[i]) {
          throw new Error(
            `p1 byte at index ${i}/${reEncryptedResult.p1.length} differs: expected(${p1Data[i]}), actual(${reEncryptedResult.p1[i]})`
          );
        }
      }

      for (let i = 0; i < reEncryptedResult.p2.length; ++i) {
        if (reEncryptedResult.p2[i] !== p2Data[i]) {
          throw new Error(
            `p2 byte at index ${i}/${reEncryptedResult.p2.length} differs: expected(${p2Data[i]}), actual(${reEncryptedResult.p2[i]})`
          );
        }
      }
    });
  });
});
