# 1000C8

# 108000

The base of memory (A5) used during input processing.

## 10A786

input mode flags for P1

during title screen -> 0
during char select -> 0
during order select -> 0
during single player gameplay -> 1A
during versus play -> 1A

the input routine does more stuff for p1 if bit 3 is set, and more for p2 if bit 4 is set.

## 10d9f4

P1 buttons down this frame, I believe bit 3 needs to be set to get this?

## 10d9f7

P1 buttons that were down last frame

## 10d9fa

P1 buttons that were down last frame and still down this frame

## 10d9fb

P1 buttons that were newly pressed this frame

## 10d9fc

P1 buttons that were released this frame, I believe bit 3 needs to be set to get this?

## 10da02

Seems to be the inputs that were or'd together across 4 frames

## 10da03

One of the three previous frames that gets or'd in

## 10da04

One of the three previous frames that gets or'd in

## 10da05

One of the three previous frames that gets or'd in
