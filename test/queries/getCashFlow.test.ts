import { ApolloServer } from "apollo-server-micro";
import { createTestContext } from "./../__helpers";
import { schema } from "./../../graphql/schema";

const ctx = createTestContext();

describe("getCashFlow", () => {
  let server: ApolloServer;

  beforeAll(() => {
    server = new ApolloServer({
      schema,
      context: () => ctx,
    });
  });

  it("should return cash flow data for a specific user and month", async () => {
    const result = await server.executeOperation({
      query: `
        query GetCashFlow($userId: String!, $year: String, $month: String) {
          getCashFlow(userId: $userId, year: $year, month: $month) {
            month
            incomes
            expenses
          }
        }
      `,
    variables: {
    userId: "test-user-id",
    year: "2023",
    month: "5",
    },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.getCashFlow).toBeDefined();
    expect(result.data.getCashFlow).toEqual([
      {
        month: 5,
        incomes: expect.any(Number),
        expenses: expect.any(Number),
      },
    ]);
  });

  it("should return unauthorized error for a different user", async () => {
    const result = await server.executeOperation({
      query: `
        query GetCashFlow($userId: String!, $year: String, $month: String) {
          getCashFlow(userId: $userId, year: $year, month: $month) {
            month
            incomes
            expenses
          }
        }
      `,
      variables: {
        userId: "different-user-id",
        year: "2023",
        month: "5",
      },
    });

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toBe("Unauthorized");
  });
});
