#include "bitswap.h"
#include <stdio.h>

unsigned char *src;

// data swaps
static int p1_data_swap[5 * 2][16] = {
    {13, 7, 3, 0, 9, 4, 5, 6, 1, 12, 8, 14, 10, 11, 2, 15}, // d kof99
    {13, 12, 14, 10, 8, 2, 3, 1, 5, 9, 11, 4, 15, 0, 6, 7}, // d garou
    {14, 5, 1, 11, 7, 4, 10, 15, 3, 12, 8, 13, 0, 2, 9, 6}, // d garouo
    {4, 11, 14, 3, 1, 13, 0, 7, 2, 8, 12, 15, 10, 9, 5, 6}, // d mslug3
    {12, 8, 11, 3, 15, 14, 7, 0, 10, 13, 6, 5, 9, 2, 1, 4}, // d kof2000
                                                            // encrypt
    {0, 4, 15, 6, 2, 3, 11, 5, 14, 8, 9, 10, 13, 1, 7, 12}, // e kof99
    {3, 13, 15, 14, 5, 12, 6, 11, 0, 1, 7, 4, 9, 10, 8, 2}, // e garou
    {8, 15, 4, 6, 12, 9, 1, 5, 11, 0, 14, 10, 7, 2, 13, 3}, // e garouo
    {4, 13, 10, 5, 14, 3, 2, 6, 8, 0, 1, 15, 12, 7, 11, 9}, // e mslug3
    {11, 10, 6, 15, 13, 7, 3, 14, 9, 5, 4, 0, 12, 2, 1, 8}, // e kof2000
};

// p1 address swap
static int p1_address_swap[5][18] = {
    {11, 6, 14, 17, 16, 5, 8, 10, 12, 0, 4, 3, 2, 7, 9, 15, 13, 1}, // kof99
    {4, 5, 16, 14, 7, 9, 6, 13, 17, 15, 3, 1, 2, 12, 11, 8, 10, 0}, // garou
    {5, 16, 11, 2, 6, 7, 17, 3, 12, 8, 14, 4, 0, 9, 1, 10, 15, 13}, // garouo
    {15, 2, 1, 13, 3, 0, 9, 6, 16, 4, 11, 5, 7, 12, 17, 14, 10, 8}, // mslug3
    {8, 4, 15, 13, 3, 14, 16, 2, 6, 17, 7, 12, 10, 0, 5, 11, 1, 9}, // kof2000
};

// p2 address swap
static int p2_address_swap[5 * 2][16] = {
    {15, 14, 13, 12, 11, 10, 6, 2, 4, 9, 8, 3, 1, 7, 0, 5}, // d kof99
    {15, 14, 9, 4, 8, 3, 13, 6, 2, 7, 0, 12, 1, 11, 10, 5}, // d garou
    {15, 14, 12, 8, 1, 7, 11, 3, 13, 10, 6, 9, 5, 4, 0, 2}, // d garouo
    {15, 2, 11, 0, 14, 6, 4, 13, 8, 9, 3, 10, 7, 5, 12, 1}, // d mslug3
    {15, 14, 13, 12, 11, 10, 4, 1, 3, 8, 6, 2, 7, 0, 9, 5}, // d kof2000

    {15, 14, 13, 12, 11, 10, 6, 5, 2, 9, 0, 7, 4, 8, 3, 1}, // e kof99
    {15, 14, 9, 4, 2, 1, 13, 11, 6, 8, 0, 12, 10, 7, 3, 5}, // e garou
    {15, 14, 7, 13, 9, 6, 4, 12, 10, 5, 3, 2, 8, 0, 11, 1}, // e garouo
    {15, 11, 8, 1, 13, 4, 6, 7, 3, 10, 2, 9, 5, 14, 0, 12}, // e mslug3
    {15, 14, 13, 12, 11, 10, 1, 6, 3, 5, 0, 9, 7, 4, 8, 2}, // e kof2000
};

// address offsets
static int address_offset[5][2] = {
    //	  p1        p2
    {0x700000, 0x600000}, // kof99
    {0x710000, 0x800000}, // garou
    {0x7f8000, 0x800000}, // garouo
    {0x5D0000, 0x800000}, // mslug3
    {0x73a000, 0x63a000}, // kof2000
};

static void SMAcrypt(int type, int crypt) // crypt 1 = encrypt, 0 = decrypt
{
  int i, j;
  int *a = p1_data_swap[type + crypt * 5];
  int *b = p1_address_swap[type];
  int *c = p2_address_swap[type + crypt * 5];
  int *d = address_offset[type];

  //   printf("start first loop\n");

  // scramble or unscramble all of the words that make up p1 and p2;
  for (i = 0; i < 0x800000 / 2; i++) {
    unsigned short before = ((unsigned short *)(src + 0x100000))[i];
    unsigned short after =
        BITSWAP16(before, a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8],
                  a[9], a[10], a[11], a[12], a[13], a[14], a[15]);

    // printf("b:%hu, a:%hu\n", before, after);

    ((unsigned short *)(src + 0x100000))[i] = BITSWAP16(
        ((unsigned short *)(src + 0x100000))[i], a[0], a[1], a[2], a[3], a[4],
        a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
  }

  //   printf("end first loop\n");

  // if decrypting, grab words out and move them before 0xc0000
  if (crypt == 0) {
    // printf("start second loop\n");
    for (i = 0; i < 0x0c0000 / 2; i++) {
      int wordAddress =
          d[0] / 2 + BITSWAP24(i, 23, 22, 21, 20, 19, 18, b[0], b[1], b[2],
                               b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10],
                               b[11], b[12], b[13], b[14], b[15], b[16], b[17]);

      short word = ((unsigned short *)src)[wordAddress];
      //   printf("wordAddress: %d, word: %hu\n", wordAddress, word);

      ((unsigned short *)src)[i] =
          ((unsigned short *)
               src)[d[0] / 2 + BITSWAP24(i, 23, 22, 21, 20, 19, 18, b[0], b[1],
                                         b[2], b[3], b[4], b[5], b[6], b[7],
                                         b[8], b[9], b[10], b[11], b[12], b[13],
                                         b[14], b[15], b[16], b[17])];
    }
    // printf("end second loop\n");
  }

  // printf("start third loop\n");

  for (i = 0; i < d[1] / 2; i += 0x010000 / 2) {
    // printf("i: %d\n", i);
    unsigned short nBuffer[0x010000 / 2];
    memcpy(nBuffer, &((unsigned short *)(src + 0x100000))[i], 0x010000);
    for (j = 0; j < 0x010000 / 2; j++) {
      unsigned short before = ((unsigned short *)(src + 0x100000))[i + j];
      unsigned short after = nBuffer[BITSWAP24(
          j, 23, 22, 21, 20, 19, 18, 17, 16, c[0], c[1], c[2], c[3], c[4], c[5],
          c[6], c[7], c[8], c[9], c[10], c[11], c[12], c[13], c[14], c[15])];

      // printf("b:%hu, a:%hu\n", before, after);

      ((unsigned short *)(src + 0x100000))[i + j] = nBuffer[BITSWAP24(
          j, 23, 22, 21, 20, 19, 18, 17, 16, c[0], c[1], c[2], c[3], c[4], c[5],
          c[6], c[7], c[8], c[9], c[10], c[11], c[12], c[13], c[14], c[15])];
    }
  }

  // printf("end third loop\n");
}

int main(int argc, char *argv[]) {
  src = (unsigned char *)malloc(0x900000);
  if (src == NULL)
    return 1;

  char tmp[64];

  int crypt, type;

  crypt = argv[1][0] == 'e' ? 1 : 0;

  type = 0; // hardcoded to kof99

  FILE *fz;

  if (crypt) {
    fz = fopen("p1_decrypted", "rb");
    if (fz == NULL) {
      printf("p1_decrypted not found\n");
      return 1;
    }

    fread(src, 0x900000, 1, fz);
    fclose(fz);
  } else {
    fz = fopen("sma", "rb");
    if (fz == NULL) {
      printf("sma not found\n");
      return 1;
    }

    fread(src + 0xc0000, 0x040000, 1, fz);
    fclose(fz);

    fz = fopen("p1", "rb");
    if (fz == NULL) {
      printf("p1 not found\n");
      return 1;
    }

    fread(src + 0x100000, 0x400000, 1, fz);
    fclose(fz);

    fz = fopen("p2", "rb");
    if (fz == NULL) {
      printf("p2 not found\n");
      return 1;
    }

    fread(src + 0x500000, 0x400000, 1, fz);
    fclose(fz);
  }

  SMAcrypt(type, crypt);

  if (!crypt) {
    fz = fopen("p1_decrypted", "wb");

    fwrite(src, 0x900000, 1, fz);
    fclose(fz);
  } else {
    fz = fopen("sma", "wb");
    fwrite(src + 0xc0000, 0x040000, 1, fz);
    fclose(fz);

    fz = fopen("p1", "wb");
    fwrite(src + 0x100000, 0x400000, 1, fz);
    fclose(fz);

    fz = fopen("p2", "wb");
    fwrite(src + 0x500000, 0x400000, 1, fz);
    fclose(fz);
  }

  free(src);
}
