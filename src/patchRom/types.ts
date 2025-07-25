export type BasePatch = {
  type: "crom" | "prom" | "prom-fill-word";
  description?: string;
  skip?: boolean;
};

export type RomFileBuffer = {
  fileName: string;
  data: number[];
};

export type BasePromPatch = BasePatch & {
  type: "prom";
  symbol?: string;
};

export type AddressPromPatch = BasePromPatch & {
  address?: string;
  subroutine?: boolean;
  patchAsm: string[];
};

export type AddressPromFilePathPatch = BasePromPatch & {
  address?: string;
  subroutine?: boolean;
  patchAsm: string;
};

export type AddressPromFileAvatarPathPatch = BasePromPatch & {
  address?: string;
  subroutine?: boolean;
  a94PatchAsm: string;
  a95PatchAsm: string;
};

export type StringPromPatch = BasePromPatch & {
  string: true;
  value: string;
};

export type FillWordPatch = BasePatch & {
  type: "prom-fill-word";
  fillerWord: string;
  address: number;
  size: number;
};

export type Patch =
  | AddressPromPatch
  | AddressPromFilePathPatch
  | StringPromPatch
  | FillWordPatch;

export type InlinePatch = AddressPromPatch | StringPromPatch;

export type SubroutineSpace = {
  start: string;
  end: string;
};

export type PatchJSON = {
  description: string;
  patches: Patch[];
  subroutineSpace?: SubroutineSpace;
  symbols?: Record<string, string>;
};
