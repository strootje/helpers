import type { StandardSchemaV1 as SS } from "@standard-schema/spec";
import { validate } from "./mod.validate.ts";

type RequestQueryInit = RequestInit & { query?: Record<string, string | Array<string>> };
type RequestInitBuilder<TIn extends SS> = (input: SS.InferOutput<TIn>) => RequestQueryInit;

type InputMapper<TIn extends SS, TOut> = (input: SS.InferOutput<TIn>) => TOut;

const buildRequestInit = <TIn extends SS>(
  input: SS.InferOutput<TIn>,
  ...builders: Array<RequestInitBuilder<TIn>>
): RequestQueryInit => {
  return builders.reduce<RequestQueryInit>((prev, builder) => {
    return ((cur) => ({
      ...{ ...prev, ...cur },
      headers: { ...prev.headers, ...cur.headers },
      query: { ...prev.query, ...cur.query },
    }))(builder(input));
  }, {});
};

const buildEndpoint = (base: string, query: Record<string, string | Array<string>>) => {
  const params = Object.keys(query).map((key) => ({ key, value: query[key] })).reduce(
    (prev, { key, value }) => {
      (Array.isArray(value) ? value : [value]).forEach((val) => prev.append(key, val));
      return prev;
    },
    new URLSearchParams(),
  );

  return `${base}?${params.toString()}`;
};

const requestInitBuilder = <TIn extends SS>(
  endpoint: string,
  schemaIn?: TIn,
  ...builders: Array<RequestInitBuilder<TIn>>
) => ({
  input: <T extends TIn>(newSchemaIn: T) => {
    return requestInitBuilder<T>(endpoint, newSchemaIn, ...builders);
  },

  headers: (mapper: InputMapper<TIn, HeadersInit>) => {
    return requestInitBuilder<TIn>(endpoint, schemaIn, ...builders, (input) => ({
      headers: mapper(input),
    }));
  },

  query: (mapper: InputMapper<TIn, Record<string, string | Array<string>>>) => {
    return requestInitBuilder<TIn>(endpoint, schemaIn, ...builders, (input) => ({
      query: mapper(input),
    }));
  },

  as: <TOut extends SS>(schemaOut: TOut) => ({
    json: () =>
    async (
      objIn: SS.InferInput<TIn>,
      signal?: Required<Pick<RequestInit, "signal">>,
    ): Promise<SS.InferOutput<TOut>> => {
      const { query, ...request } = buildRequestInit(
        schemaIn ? await validate(schemaIn, objIn) : undefined,
        ...builders,
        () => ({ ...signal }),
      );

      const resp = await fetch(buildEndpoint(endpoint, query ?? {}), request);
      return await validate(schemaOut, await resp.json());
    },
  }),
});

const method = (method: "get" | "post") => (endpoint: string): ReturnType<typeof requestInitBuilder> => {
  return requestInitBuilder(endpoint, undefined, () => ({ method }));
};

export const methods = {
  get: method("get"),
  post: method("post"),
} as const;
