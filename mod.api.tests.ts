import { expect } from "@std/expect";
import * as v from "valibot";
import { makeApiClient } from "./mod.api.ts";
import { methods } from "./mod.fetch.ts";

const clientFactory = makeApiClient({
  opts: v.pipe(
    v.object({
      baseUri: v.string(),
      apiUser: v.string(),
      apiKey: v.string(),
    }),
    v.transform(({ baseUri, ...api }) => ({
      authorization: `token ${api.apiUser}:${api.apiKey}`,
      baseUri,
    })),
  ),

  endpoints: ({ baseUri, authorization }) => ({
    lists: {
      list: methods
        .get(`${baseUri}/api/lists`)
        .input(v.object({
          tags: v.array(v.string()),
        }))
        .query(({ tags: tag }) => ({ tag }))
        .headers(() => ({ authorization }))
        .as(v.object({
          data: v.object({
            results: v.array(v.object({
              id: v.number(),
              created_at: v.pipe(v.string(), v.transform(Date.parse)),
              updated_at: v.pipe(v.string(), v.transform(Date.parse)),
              uuid: v.string(),
              name: v.string(),
              type: v.string(),
              optin: v.string(),
              tags: v.array(v.string()),
              description: v.string(),
              subscriber_count: v.number(),
              subscriber_statuses: v.object({}),
              subscription_created_at: v.nullable(v.pipe(v.string(), v.transform(Date.parse))),
              subscription_updated_at: v.nullable(v.pipe(v.string(), v.transform(Date.parse))),
            })),
          }),
        })).json(),
    },
  }),
});

Deno.test("apiClient", async () => {
  // Arrange
  const client = clientFactory({
    baseUri: "https://lists.strooware.nl",
    apiKey: "QZ8HWsdaIUebvFQ5H7zZewwIYjhdmRE1",
    apiUser: "mepclub",
  });

  // Act
  const result = await client.lists.list({ tags: ["mepclub"] });

  expect(result.data.results).toHaveLength(3);
});
