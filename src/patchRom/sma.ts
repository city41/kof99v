type SMAEncryptResult = {
  p1: number[];
  p2: number[];
};

// const dataSwapBitIndexesForEncryption = [
//   0, 4, 15, 6, 2, 3, 11, 5, 14, 8, 9, 10, 13, 1, 7, 12,
// ];

const dataSwapBitIndexesForDecryption = [
  13, 7, 3, 0, 9, 4, 5, 6, 1, 12, 8, 14, 10, 11, 2, 15,
];

const p1AddressSwapBitIndexes = [
  23, 22, 21, 20, 19, 18, 11, 6, 14, 17, 16, 5, 8, 10, 12, 0, 4, 3, 2, 7, 9, 15,
  13, 1,
];

// const p2AddressSwapBitIndexesForEncryption = [
//   15, 14, 13, 12, 11, 10, 6, 5, 2, 9, 0, 7, 4, 8, 3, 1,
// ];

const p2AddressSwapBitIndexesForDecryption = [
  15, 14, 13, 12, 11, 10, 6, 2, 4, 9, 8, 3, 1, 7, 0, 5,
];

const p1AddressOffset = 0x700000;
const p2AddressOffset = 0x600000;

const decryptedSize = 0x900000;

function bitswap(n: number, bitIndexes: number[]): number {
  if (bitIndexes.length !== 16 && bitIndexes.length !== 24) {
    throw new Error(
      `bitswap: There must be 16 or 24 bit indexes, received: ${bitIndexes.length}`
    );
  }

  let swapped = 0;

  for (let i = 0; i < bitIndexes.length; ++i) {
    const bit = ((n >> bitIndexes[i]) & 1) << (bitIndexes.length - 1 - i);
    swapped |= bit;
  }

  return swapped;
}

function smaDecrypt(
  smaData: number[],
  p1Data: number[],
  p2Data: number[]
): number[] {
  const fillerBeforeSma = new Array(0xc0000).fill(0);
  const decrypted = [...fillerBeforeSma, ...smaData, ...p1Data, ...p2Data];
  if (decrypted.length !== decryptedSize) {
    throw new Error(
      `smaDecrypt: provided data did not add up to expected size, received: ${decrypted.length}, expected: ${decryptedSize}`
    );
  }

  function insert(i: number, v: number) {
    if (i < 0) {
      throw new Error(`insert, index is negative: ${i}`);
    }

    if (i >= decryptedSize) {
      throw new Error(`insert, index out of range: ${i}`);
    }

    decrypted[i] = v;
  }

  const baseWordAddress = 0x100000 / 2;
  for (let i = 0; i < 0x800000 / 2; i++) {
    const wordAddress = baseWordAddress + i;
    const byteAddress = wordAddress * 2;
    const word = (decrypted[byteAddress + 1] << 8) | decrypted[byteAddress];
    const swapped = bitswap(word, dataSwapBitIndexesForDecryption);
    insert(byteAddress + 1, swapped >> 8);
    insert(byteAddress, swapped & 0xff);
  }

  for (let i = 0; i < 0x0c0000 / 2; i++) {
    const wordAddress =
      p1AddressOffset / 2 + bitswap(i, p1AddressSwapBitIndexes);
    const byteAddress = wordAddress * 2;

    insert(i * 2, decrypted[byteAddress]);
    insert(i * 2 + 1, decrypted[byteAddress + 1]);
  }

  for (let i = 0; i < p2AddressOffset / 2; i += 0x010000 / 2) {
    const copyWordIndexStart = 0x100000 / 2 + i;
    const copyWordIndexEnd = copyWordIndexStart + 0x10000 / 2;
    const buffer = decrypted.slice(
      copyWordIndexStart * 2,
      copyWordIndexEnd * 2
    );

    if (buffer.length !== 0x10000) {
      throw new Error(
        `expected buffer to be length 0x10000, got 0x${buffer.length.toString(
          16
        )}`
      );
    }

    for (let j = 0; j < 0x10000 / 2; ++j) {
      const wordAddress = 0x100000 / 2 + i + j;
      const byteAddress = wordAddress * 2;
      const bufferWordIndex = bitswap(j, p2AddressSwapBitIndexesForDecryption);
      const bufferByteIndex = bufferWordIndex * 2;
      insert(byteAddress, buffer[bufferByteIndex]);
      insert(byteAddress + 1, buffer[bufferByteIndex + 1]);
    }
  }

  return decrypted;
}

function smaEncrypt(_decryptedProm: number[]): SMAEncryptResult {
  return {
    p1: [],
    p2: [],
  };
}

export { smaDecrypt, smaEncrypt };
export type { SMAEncryptResult };
