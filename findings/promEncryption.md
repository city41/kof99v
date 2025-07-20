# PROM Encryption

the PROMs are encrypted and the sma chip on the prog board does the decryption at run time.

iq_132 of the neosource forums provided a c program that can decrypt and encrypt SMA PROMs.

https://neo-source.com/index.php?topic=1066.0

The code for this was pulled into `src/promEncryption/src/` and altered a bit.

That code was then ported to typescript at `src/patchRom/sma.ts`
