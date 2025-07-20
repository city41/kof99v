import os from "node:os";
import path from "node:path";

export const tmpDir = path.resolve(os.tmpdir(), "kof99v");
export const romTmpDir = path.resolve(tmpDir, "rom");
export const asmTmpDir = path.resolve(tmpDir, "asm");
export const progCTmpDir = path.resolve(tmpDir, "progc");
export const P1_FILE_NAME = "251-p1.p1";
export const P2_FILE_NAME = "251-p2.p2";
export const SMA_FILE_NAME = "ka.neo-sma";
// TODO: kof99's s rom is embedded in the croms
export const SROM_FILE_NAME = "251-s1.s1";
