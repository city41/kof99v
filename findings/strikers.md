# Strikers

## striker activation

is done with BC.

The averaged input across four frames is stored at 10da02 for p1.

This is looked for in the subroutine at 107c0

A4=108100

;; is the byte at 1082e3 zero?
0107C0: 4A2C 01E3 tst.b ($1e3,A4)
;; of so, branch out of here
0107C4: 6700 0018      beq     $107de
;; is the 0'th bit at 1081e7 not zero?
0107C8: 082C 0000 00E7 btst    #$0, ($e7,A4)
;; if so, branch out of here
0107CE: 660E bne $107de
;; is the current input for p1 BC?
0107D0: 0C2E 0060 0008 cmpi.b #$60, ($8,A6)
;; if p1 isn't pressing bc, go below and set D0=0
0107D6: 6600 0006 bne $107de
;; bc is pressed, so set D0=1
0107DA: 7001 moveq #$1, D0
0107DC: 4E75 rts
0107DE: 7000 moveq #$0, D0
0107E0: 4E75 rts

this subroutine is basically "set in D0 whether BC is pressed or not"

We can disabling strikers with a simple one line patch

0107DA: 7001 moveq #$1, D0

becomes

0107DA: 7001 moveq #$0, D0
