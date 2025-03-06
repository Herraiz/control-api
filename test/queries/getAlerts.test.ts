import { ApolloServer } from "apollo-server-micro";
import { createTestContext } from "./../__helpers";
import { schema } from "./../../graphql/schema";

const ctx = createTestContext();

describe("getAlerts", () => {
  let server: ApolloServer;

  beforeAll(() => {
    server = new ApolloServer({
      schema,
      context: () => ctx,
    });
  });

  // Clean up budgets before each test to avoid interference between tests
  beforeEach(async () => {
    // Delete all budgets for the test user
    await ctx.prisma.transaction.deleteMany({
      where: { userId: "test-user-id" },
    });
    await ctx.prisma.budget.deleteMany({
      where: { userId: "test-user-id" },
    });
  });

  it("should return error if userId is not the same as ctx.id", async () => {
    const result = await server.executeOperation({
      query: `
        query GetAlerts($userId: String!, $month: Int, $year: Int) {
          getAlerts(userId: $userId, month: $month, year: $year) {
            type
          }
        }
      `,
      variables: {
        userId: "different-user-id",
      },
    });

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toBe("Unauthorized");
  });

  it("should return no alert if no budget exceeds", async () => {
    const budget = await ctx.prisma.budget.create({
      data: {
        name: `Presupuesto test 1000`,
        amount: 1000,
        category: "ENTERTAINMENT",
        isRecurring: false,
        createdAt: new Date(2024, 11, 1),
        updatedAt: new Date(2024, 11, 1),
        userId: "test-user-id",
      },
    });

    await ctx.prisma.transaction.create({
      data: {
        name: `Gasto test 1500`,
        date: new Date(2024, 11, 1),
        amount: 200,
        type: "EXPENSE",
        category: "ENTERTAINMENT",
        userId: "test-user-id",
        budgetId: budget.id,
      },
    });

    const result = await server.executeOperation({
      query: `
    query getAlerts($userId: String!, $month: Int, $year: Int) {
        getAlerts(userId: $userId, month: $month, year: $year) {
        type
        }
    }
    `,
      variables: {
        userId: "test-user-id",
        month: 12, // December
        year: 2024,
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.getAlerts).toBeDefined();
    expect(result.data.getAlerts).toEqual([]);
  });

  it("should return alert if getting a budget with expenses greater than the budget max amount", async () => {
    const budget = await ctx.prisma.budget.create({
      data: {
        name: `Presupuesto test 1000`,
        amount: 1000,
        category: "ENTERTAINMENT",
        isRecurring: false,
        createdAt: new Date(2024, 11, 1),
        updatedAt: new Date(2024, 11, 1),
        userId: "test-user-id",
      },
    });

    await ctx.prisma.transaction.create({
      data: {
        name: `Gasto test 1500`,
        date: new Date(2024, 11, 1),
        amount: 1500,
        type: "EXPENSE",
        category: "ENTERTAINMENT",
        userId: "test-user-id",
        budgetId: budget.id,
      },
    });

    const result = await server.executeOperation({
      query: `
    query getAlerts($userId: String!, $month: Int, $year: Int) {
        getAlerts(userId: $userId, month: $month, year: $year) {
        type
        }
    }
    `,
      variables: {
        userId: "test-user-id",
        month: 12,
        year: 2024,
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.getAlerts).toBeDefined();
    expect(result.data.getAlerts).toEqual([
      {
        type: "BUDGET_EXCEEDED",
      },
    ]);
  });

  it("should return alert if getting a budget with expenses more than 80%", async () => {
    const budget = await ctx.prisma.budget.create({
      data: {
        name: `Presupuesto test 1000`,
        amount: 1000,
        category: "ENTERTAINMENT",
        isRecurring: false,
        createdAt: new Date(2024, 11, 1),
        updatedAt: new Date(2024, 11, 1),
        userId: "test-user-id",
      },
    });

    await ctx.prisma.transaction.create({
      data: {
        name: `Gasto test 801`,
        date: new Date(2024, 11, 1),
        amount: 801,
        type: "EXPENSE",
        category: "ENTERTAINMENT",
        userId: "test-user-id",
        budgetId: budget.id,
      },
    });

    const result = await server.executeOperation({
      query: `
    query getAlerts($userId: String!, $month: Int, $year: Int) {
        getAlerts(userId: $userId, month: $month, year: $year) {
        type
        }
    }
    `,
      variables: {
        userId: "test-user-id",
        month: 12,
        year: 2024,
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.getAlerts).toBeDefined();
    expect(result.data.getAlerts).toEqual([
      {
        type: "BUDGET_80",
      },
    ]);
  });

  it("should return same input without using month and year args", async () => {
    const budget = await ctx.prisma.budget.create({
      data: {
        name: `Presupuesto test 1000`,
        amount: 1000,
        category: "ENTERTAINMENT",
        isRecurring: false,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        userId: "test-user-id",
      },
    });

    await ctx.prisma.transaction.create({
      data: {
        name: `Gasto test 801`,
        date: new Date(Date.now()),
        amount: 801,
        type: "EXPENSE",
        category: "ENTERTAINMENT",
        userId: "test-user-id",
        budgetId: budget.id,
      },
    });

    const result = await server.executeOperation({
      query: `
    query getAlerts($userId: String!, $month: Int, $year: Int) {
        getAlerts(userId: $userId, month: $month, year: $year) {
        type
        }
    }
    `,
      variables: {
        userId: "test-user-id",
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.getAlerts).toBeDefined();
    expect(result.data.getAlerts).toEqual([
      {
        type: "BUDGET_80",
      },
    ]);
  });
});
