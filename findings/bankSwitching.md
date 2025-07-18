# Bank Switching

KOF99 has two PROMs that are 4mib each. There is only space in the memory map for 2mib of PROM. The first mib in the memory map at 0-fffff is fixed, and the mib at 200000-2fffff can be swapped by writing a word anywhere between 200000-2fffff.

KOF99 accomplishes its bank switching by writing a word to 2ffff0. And it seems like that word always comes from D0

```asm
8c10: move.w D0, $2ffff0.l
```

It bank switches rapidly and all the time. Often it does a bank switch, grabs just a word or two from the bank that just got loaded, then bank switches somewhere else.

## Bank switching challenges

Based on the zero report, it is likely the hack will have to live in banks that get switched in and out. So that means whenever the hack wants to do something, it will need to

- bank switch to the bank containing the hack's code
- run the hack's code
- bank switch back to whatever bank it was previously on

That is probably doable, but remembering what bank it was on might be tricky. Might need to intercept all bank switches and store the switched to bank in memory somewhere.
