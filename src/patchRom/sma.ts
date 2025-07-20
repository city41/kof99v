type SMAEncryptResult = {
  sma: number[];
  p1: number[];
  p2: number[];
};

const dataSwapBitIndexesForEncryption = [
  0, 4, 15, 6, 2, 3, 11, 5, 14, 8, 9, 10, 13, 1, 7, 12,
];

const dataSwapBitIndexesForDecryption = [
  13, 7, 3, 0, 9, 4, 5, 6, 1, 12, 8, 14, 10, 11, 2, 15,
];

const p1AddressSwapBitIndexesForDecryption = [
  23, // 23
  22, // 22
  21, // 21
  20, // 20
  19, // 19
  18, // 18

  11, // 17
  6, // 16
  14, // 15
  17, // 14
  16, // 13
  5, // 12
  8, // 11
  10, // 10
  12, // 9
  0, // 8
  4, // 7
  3, // 6
  2, // 5
  7, // 4
  9, // 3
  15, // 2
  13, // 1
  1, // 0
];

// const p1AddressSwapBitIndexesForEncryption = [
//   23, // 23
//   22, // 22
//   21, // 21
//   20, // 20
//   19, // 19
//   18, // 18

//   14, // 17
//   13, // 16
//   2, // 15
//   15, // 14
//   1, // 13
//   9, // 12
//   17, // 11
//   10, // 10
//   3, // 9
//   11, // 8
//   4, // 7
//   16, // 6
//   12, // 5
//   7, // 4
//   6, // 3
//   5, // 2
//   0, // 1
//   8, // 0
// ];

const p2AddressSwapBitIndexesForEncryption = [
  15, 14, 13, 12, 11, 10, 6, 5, 2, 9, 0, 7, 4, 8, 3, 1,
];

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

  // unscramble the words individually from 1mb->9mb, ie p1 and p2
  const baseWordAddress = 0x100000 / 2;
  for (let i = 0; i < 0x800000 / 2; i++) {
    const wordAddress = baseWordAddress + i;
    const byteAddress = wordAddress * 2;
    const word = (decrypted[byteAddress + 1] << 8) | decrypted[byteAddress];
    const swapped = bitswap(word, dataSwapBitIndexesForDecryption);
    insert(byteAddress + 1, swapped >> 8);
    insert(byteAddress, swapped & 0xff);
  }

  // move words from various places down into the filler area, ahead of esma
  for (let i = 0; i < 0x0c0000 / 2; i++) {
    const wordAddress =
      p1AddressOffset / 2 + bitswap(i, p1AddressSwapBitIndexesForDecryption);
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

function smaEncrypt(decryptedPromBundle: number[]): SMAEncryptResult {
  const encrypted = [...decryptedPromBundle];

  function insert(i: number, v: number) {
    if (i < 0) {
      throw new Error(`insert, index is negative: ${i}`);
    }

    if (i >= decryptedPromBundle.length) {
      throw new Error(`insert, index out of range: ${i}`);
    }

    encrypted[i] = v;
  }

  // move words from the filler area back into p1/p2
  for (let i = 0; i < 0x0c0000 / 2; i++) {
    const wordAddress =
      p1AddressOffset / 2 + bitswap(i, p1AddressSwapBitIndexesForDecryption);
    const byteAddress = wordAddress * 2;

    insert(byteAddress, encrypted[i * 2]);
    insert(byteAddress + 1, encrypted[i * 2 + 1]);
  }

  const baseWordAddress = 0x100000 / 2;
  for (let i = 0; i < 0x800000 / 2; i++) {
    const wordAddress = baseWordAddress + i;
    const byteAddress = wordAddress * 2;
    const word = (encrypted[byteAddress + 1] << 8) | encrypted[byteAddress];
    const swapped = bitswap(word, dataSwapBitIndexesForEncryption);
    insert(byteAddress + 1, swapped >> 8);
    insert(byteAddress, swapped & 0xff);
  }

  for (let i = 0; i < p2AddressOffset / 2; i += 0x010000 / 2) {
    const copyWordIndexStart = 0x100000 / 2 + i;
    const copyWordIndexEnd = copyWordIndexStart + 0x10000 / 2;
    const buffer = encrypted.slice(
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
      const bufferWordIndex = bitswap(j, p2AddressSwapBitIndexesForEncryption);
      const bufferByteIndex = bufferWordIndex * 2;
      insert(byteAddress, buffer[bufferByteIndex]);
      insert(byteAddress + 1, buffer[bufferByteIndex + 1]);
    }
  }

  return {
    sma: encrypted.slice(0xc0000, 0xc0000 + 0x40000),
    p1: encrypted.slice(0x100000, 0x100000 + 0x400000),
    p2: encrypted.slice(0x500000, 0x500000 + 0x400000),
  };
}

export { smaDecrypt, smaEncrypt };
export type { SMAEncryptResult };
