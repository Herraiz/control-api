/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/functional-parameters */
import { Currency, UserRole, Gender, UserStatus } from "@prisma/client";
import { Context } from "./../graphql/context";

// Mock storage para simular datos de prueba
const mockData = {
  budgets: [] as any[],
  transactions: [] as any[],
};

// Mock de Prisma
const mockPrisma = {
  user: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  budget: {
    create: jest.fn().mockImplementation((data) => {
      const budget = {
        id: `budget-${Date.now()}`,
        userId: data.data.userId,
        name: data.data.name,
        amount: data.data.amount,
        category: data.data.category,
        isRecurring: data.data.isRecurring,
        createdAt: data.data.createdAt,
        updatedAt: data.data.updatedAt,
      };
      mockData.budgets.push(budget);
      return Promise.resolve(budget);
    }),
    deleteMany: jest.fn().mockImplementation(() => {
      mockData.budgets = [];
      return Promise.resolve({});
    }),
    findMany: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockData.budgets);
    }),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  transaction: {
    create: jest.fn().mockImplementation((data) => {
      const transaction = {
        id: `transaction-${Date.now()}`,
        userId: data.data.userId,
        name: data.data.name,
        amount: data.data.amount,
        type: data.data.type,
        category: data.data.category,
        date: data.data.date,
        budgetId: data.data.budgetId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockData.transactions.push(transaction);
      return Promise.resolve(transaction);
    }),
    deleteMany: jest.fn().mockImplementation(() => {
      mockData.transactions = [];
      return Promise.resolve({});
    }),
    findMany: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockData.transactions);
    }),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn().mockImplementation((params) => {
      // Filtrar transacciones según los parámetros
      let filteredTransactions = mockData.transactions;

      if (params.where) {
        if (params.where.userId) {
          filteredTransactions = filteredTransactions.filter(
            (t: any) => t.userId === params.where.userId,
          );
        }
        if (params.where.budgetId) {
          filteredTransactions = filteredTransactions.filter(
            (t: any) => t.budgetId === params.where.budgetId,
          );
        }
        if (params.where.type) {
          filteredTransactions = filteredTransactions.filter(
            (t: any) => t.type === params.where.type,
          );
        }
        if (params.where.date?.gte && params.where.date?.lt) {
          filteredTransactions = filteredTransactions.filter((t: any) => {
            const transactionDate = new Date(t.date);
            return (
              transactionDate >= params.where.date.gte &&
              transactionDate < params.where.date.lt
            );
          });
        }
      }

      const totalAmount = filteredTransactions.reduce(
        (sum: number, t: any) => sum + t.amount,
        0,
      );

      return Promise.resolve({
        _sum: { amount: totalAmount },
        _count: { id: filteredTransactions.length },
      });
    }),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  debt: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
} as any;

export function createTestContext(): Context {
  // Simula un usuario autenticado
  const user = {
    id: "test-user-id",
    email: "test@example.com",
    password: "test-password",
    aclRole: UserRole.USER,
    name: "Test User",
    lastname: "Test Lastname",
    birthday: new Date("1990-01-01"),
    gender: Gender.FEMALE,
    currency: Currency.EUR,
    newsletterOptIn: false,
    ActivityLog: [],
    LoginLog: [],
    transactions: [],
    budgets: [],
    debts: [],
    status: UserStatus.ACTIVE,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Devuelve el contexto de prueba con Prisma mockeado
  return {
    prisma: mockPrisma,
    user,
    meta: {
      remoteAddress: "127.0.0.1",
      remoteClientIdentity: undefined,
      source: undefined,
    },
  };
}

// Función para resetear los mocks entre tests
export function resetMocks() {
  Object.values(mockPrisma).forEach((model: any) => {
    Object.values(model).forEach((method: any) => {
      if (typeof method.mockClear === "function") {
        method.mockClear();
      }
    });
  });
}

// Función para configurar mocks específicos para tests de alertas
export function setupAlertMocks(budgetData: any, transactionSum: number = 0) {
  // Mock para presupuestos
  mockPrisma.budget.findMany.mockResolvedValue([budgetData]);

  // Mock para transacciones agregadas
  mockPrisma.transaction.aggregate.mockResolvedValue({
    _sum: { amount: transactionSum },
    _count: { id: 1 },
  });
}

// Mantén estas funciones por compatibilidad, pero ahora no hacen nada real
export async function setupTestData() {
  // No hace nada porque estamos usando mocks
  return Promise.resolve();
}

export async function cleanupTestData() {
  // No hace nada porque estamos usando mocks
  resetMocks();
  return Promise.resolve();
}
