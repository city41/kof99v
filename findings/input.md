# Input

kof99 does not use `BIOS_PXCURRENT`, instead using the raw input from `REG_PXCNT`

```asm
008D5C: 1039 0030 0000 move.b  $300000.l, D0
008D62: 4600           not.b   D0
008D64: 1639 0034 0000 move.b  $340000.l, D3
008D6A: 4603           not.b   D3
```

The full input routine

```asm
;; load REG_P1CNT into D0
008D5C: 1039 0030 0000      move.b  $300000.l, D0
;; flip it since inputs are opposite of convention (0 is pressed, 1 is not)
008D62: 4600                not.b   D0
;; load REG_P2CNT into D3
008D64: 1639 0034 0000      move.b  $340000.l, D3
;; flip it since inputs are opposite of convention (0 is pressed, 1 is not)
008D6A: 4603                not.b   D3
;; test the 3rd bit of the byte at (2786, A5)
008D6C: 08AD 0003 2786      bclr    #$3, ($2786,A5)
;; if that bit was zero, branch
008D72: 6718                beq     $8d8c
;; D7 = D0, copy off p1 input byte to d7
008D74: 3E00                move.w  D0, D7
;; D0 &= 0f
;; make d0 only be the bottom nibble, ie 0000xxxx
008D76: 0240 000F           andi.w  #$f, D0
;; D7 &= 0xf0
;; make d7 only be the top nibble, ie xxxx0000
008D7A: 0247 00F0           andi.w  #$f0, D7
;; rotate D7 by 4 bits to the right, ie 10101111 -> 00001010
;; so now D7 is 0000xxxx
008D7E: E85F                ror.w   #4, D7

;; D0 is 0000RLDU
;; D7 is 0000DCBA

;; load effective address, place the long pointed to by (d86,PC) into A0
;; A0 = (9B08)
008D80: 41FA 0D86           lea     ($d86,PC) ; ($9b08), A0
;; somehow adjust D7 based on what is found at 1000c8
;; D7 += (-7f38,A5)
008D84: DE6D 80C8           add.w   (-$7f38,A5), D7

;; somehow take that adjustment, index into the table at A0 with it
;; and or it onto D0
008D88: 8030 7000           or.b    (A0,D7.w), D0
008D8C: 08AD 0004 2786      bclr    #$4, ($2786,A5)
008D92: 6718                beq     $8dac
008D94: 3E03                move.w  D3, D7
008D96: 0243 000F           andi.w  #$f, D3
008D9A: 0247 00F0           andi.w  #$f0, D7
008D9E: E85F                ror.w   #4, D7
008DA0: 41FA 0D66           lea     ($d66,PC) ; ($9b08), A0
008DA4: DE6D 80CA           add.w   (-$7f36,A5), D7
008DA8: 8630 7000           or.b    (A0,D7.w), D3

;; done with p2 handling

;; load previous p1 input state into D1
008DAC: 122D 59F4           move.b  ($59f4,A5), D1
;; load current p1 input state into 10d9f4
008DB0: 1B40 59F4           move.b  D0, ($59f4,A5)
;; save previous p1 input state to 10d9f7
008DB4: 1B41 59F7           move.b  D1, ($59f7,A5)
;; move p1 previous input state into D2
008DB8: 1401                move.b  D1, D2
;; D1 = D0 & D1
;; and previous and current together
;; D1 now holds inputs that were down last frame and this frame
008DBA: C200                and.b   D0, D1
;; save that p1 input state (prev and cur) to 10d9fa
008DBC: 1B41 59FA           move.b  D1, ($59fa,A5)
;; D1 = D2
;; restore D1 as the previous state
008DC0: 1202                move.b  D2, D1
;; D1 = curstate ^ previous state
008DC2: B101                eor.b   D0, D1
008DC4: C401                and.b   D1, D2
008DC6: 1B42 59FC           move.b  D2, ($59fc,A5)
008DCA: 41ED 5A02           lea     ($5a02,A5), A0
008DCE: C001                and.b   D1, D0
008DD0: 1B68 0001 59FB      move.b  ($1,A0), ($59fb,A5)
008DD6: 1168 0002 0001      move.b  ($2,A0), ($1,A0)
008DDC: 1168 0003 0002      move.b  ($3,A0), ($2,A0)
008DE2: 1168 0004 0003      move.b  ($4,A0), ($3,A0)
008DE8: 1140 0004           move.b  D0, ($4,A0)
008DEC: 8028 0001           or.b    ($1,A0), D0
008DF0: 8028 0002           or.b    ($2,A0), D0
008DF4: 8028 0003           or.b    ($3,A0), D0
008DF8: 1080                move.b  D0, (A0)
008DFA: 41ED 5A0A           lea     ($5a0a,A5), A0
008DFE: 43ED 59FD           lea     ($59fd,A5), A1
008E02: 102D 59FA           move.b  ($59fa,A5), D0
008E06: 6100 0132           bsr     $8f3a
008E0A: 1003                move.b  D3, D0
008E0C: 122D 59F5           move.b  ($59f5,A5), D1
008E10: 1B40 59F5           move.b  D0, ($59f5,A5)
008E14: 1B41 59F8           move.b  D1, ($59f8,A5)
008E18: 1401                move.b  D1, D2
008E1A: C200                and.b   D0, D1
008E1C: 1B41 5A12           move.b  D1, ($5a12,A5)
008E20: 1202                move.b  D2, D1
008E22: B101                eor.b   D0, D1
008E24: C401                and.b   D1, D2
008E26: 1B42 5A14           move.b  D2, ($5a14,A5)
008E2A: 41ED 5A1A           lea     ($5a1a,A5), A0
008E2E: C001                and.b   D1, D0
008E30: 1B68 0001 5A13      move.b  ($1,A0), ($5a13,A5)
008E36: 1168 0002 0001      move.b  ($2,A0), ($1,A0)
008E3C: 1168 0003 0002      move.b  ($3,A0), ($2,A0)
008E42: 1168 0004 0003      move.b  ($4,A0), ($3,A0)
008E48: 1140 0004           move.b  D0, ($4,A0)
008E4C: 8028 0001           or.b    ($1,A0), D0
008E50: 8028 0002           or.b    ($2,A0), D0
008E54: 8028 0003           or.b    ($3,A0), D0
008E58: 1080                move.b  D0, (A0)
008E5A: 41ED 5A22           lea     ($5a22,A5), A0
008E5E: 43ED 5A15           lea     ($5a15,A5), A1
008E62: 102D 5A12           move.b  ($5a12,A5), D0
008E66: 6100 00D2           bsr     $8f3a
008E6A: 422D 5A36           clr.b   ($5a36,A5)
008E6E: 422D 5A37           clr.b   ($5a37,A5)
008E72: 422D 5A38           clr.b   ($5a38,A5)
008E76: 0C39 0002 0010 FDAF cmpi.b  #$2, $10fdaf.l
008E7E: 6600 0064           bne     $8ee4
008E82: 102D 6671           move.b  ($6671,A5), D0
008E86: 44C0                move    D0, CCR
008E88: 6414                bcc     $8e9e
008E8A: 1B6D 59FA 5A36      move.b  ($59fa,A5), ($5a36,A5)
008E90: 1B6D 59FB 5A37      move.b  ($59fb,A5), ($5a37,A5)
008E96: 1B6D 59FC 5A38      move.b  ($59fc,A5), ($5a38,A5)
008E9C: 44C0                move    D0, CCR
008E9E: 6844                bvc     $8ee4
008EA0: 102D 5A12           move.b  ($5a12,A5), D0
008EA4: 812D 5A36           or.b    D0, ($5a36,A5)
008EA8: 102D 5A13           move.b  ($5a13,A5), D0
008EAC: 812D 5A37           or.b    D0, ($5a37,A5)
008EB0: 102D 5A14           move.b  ($5a14,A5), D0
008EB4: 812D 5A38           or.b    D0, ($5a38,A5)
008EB8: 602A                bra     $8ee4
008EBA: 1B6D 59FA 5A36      move.b  ($59fa,A5), ($5a36,A5)
008EC0: 1B6D 59FB 5A37      move.b  ($59fb,A5), ($5a37,A5)
008EC6: 1B6D 59FC 5A38      move.b  ($59fc,A5), ($5a38,A5)
008ECC: 102D 5A12           move.b  ($5a12,A5), D0
008ED0: 812D 5A36           or.b    D0, ($5a36,A5)
008ED4: 102D 5A13           move.b  ($5a13,A5), D0
008ED8: 812D 5A37           or.b    D0, ($5a37,A5)
008EDC: 102D 5A14           move.b  ($5a14,A5), D0
008EE0: 812D 5A38           or.b    D0, ($5a38,A5)
008EE4: 082D 0006 8000      btst    #$6, (-$8000,A5)
008EEA: 6602                bne     $8eee
008EEC: 4E75                rts
008EEE: 1B6D 59FD 59FB      move.b  ($59fd,A5), ($59fb,A5)
008EF4: 1B6D 5A15 5A13      move.b  ($5a15,A5), ($5a13,A5)
008EFA: 4E75                rts
```
