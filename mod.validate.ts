import type { StandardSchemaV1 as SS } from "@standard-schema/spec";

export const validate = async <T extends SS>(schema: T, input: SS.InferInput<T>): Promise<SS.InferOutput<T>> => {
  const result = await schema["~standard"].validate(input);

  if (result.issues) {
    throw new Error(JSON.stringify(result.issues, null, 2));
  }

  return result.value;
};

export const validateSync = <T extends SS>(schema: T, input: SS.InferInput<T>): SS.InferOutput<T> => {
  const result = schema["~standard"].validate(input);

  if (result instanceof Promise) {
    throw new Error("promises not supported");
  }

  if (result.issues) {
    throw new Error(JSON.stringify(result.issues, null, 2));
  }

  return result.value;
};
