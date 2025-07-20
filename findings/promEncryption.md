# PROM Encryption

the PROMs are encrypted and the sma chip on the prog board does the decryption at run time.

iq_132 of the neosource forums provided a c program that can decrypt and encrypt SMA PROMs.

https://neo-source.com/index.php?topic=1066.0

The code for this was pulled into `src/promEncryption/src/` and altered a bit.

That code was then ported to typescript at `src/patchRom/sma.ts`

## not working for BC disable patch

Disabling P1 BC means changing `107da: moveq.b 1, D0` to `107da: moveq.b 0, D0`, this tells the game that BC was not pressed, so don't send out a striker.

When decrypting, the end result is a 9.4mb binary that

- unscrambles the words in place from 0x10000->0x90000. This is the encrypted data from P1 and P2, descrambled (decrypted)

- uses address descrambling to move words around, and moves data up into 0->0xC0000

- 0xC0000->0x100000 is the sma

So once decrypted, the pulled words out of p1/p2 via address descrambling, plus the sma itself, end up forming the the PROM that gets loaded into the memory map from 0->0x100000. This is the prog data that can not be banked out and is present the entire time the game is running.

107da, unpatched, is `70 01`, which are the bytes for `moveq.b 1, D0`. After P1/P2 have been decrypted, these bytes come from address 0x7232f8 and 0x7232f9. The address descrambling moves them to 107da and 107db.

## Need to re-address-scramble when encrypting

ideally patches will run on the decrypted and de-address-scrambled version of the binary. This most closely matches what is seen at runtime and when debugging through MAME, so this would be the easiest (but mind you, still a PITA due to bank switching).

What needs to happen when encrypting

- Redo the decryption loop that moves words up into 0->-0xc0000 and put them back where they came from in the decrypted p1/p2 space.
  - ie, a new loop that accomplishes the opposite
- Then continue with encryption as normal

## assumption

This is assuming the code in sma that makes up 0xc0000->0x100000 will never need to be patched. If it does, then back to the drawing board. That is because the sma itself is an odd mystery in all of this. Is it just overlaid into memory as-is? Or is it also decrypted?
