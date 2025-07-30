import type { StandardSchemaV1 as SS } from "@standard-schema/spec";
import { validateSync } from "./mod.validate.ts";

type Opts<TClientOpts extends SS, TClientEndpoints> = {
  opts: TClientOpts;
  endpoints: (opts: SS.InferOutput<TClientOpts>) => TClientEndpoints;
};

type ApiClientFactory<TClientOpts extends SS, TClientEndpoints> = (
  opts: SS.InferInput<TClientOpts>,
) => TClientEndpoints;

export const makeApiClient = <TClientOpts extends SS, TClientEndpoints>(
  bopts: Opts<TClientOpts, TClientEndpoints>,
): ApiClientFactory<TClientOpts, TClientEndpoints> => {
  return (opts: SS.InferInput<TClientOpts>): TClientEndpoints => {
    return bopts.endpoints(validateSync(bopts.opts, opts));
  };
};
