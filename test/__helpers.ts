import {
  Currency,
  PrismaClient,
  UserRole,
  Gender,
  UserStatus,
} from "@prisma/client";
import { Context } from "./../graphql/context";

const prisma = new PrismaClient();

export function createTestContext(): Context {
  // Simula un usuario autenticado
  const user = {
    id: "test-user-id",
    email: "test@example.com",
    password: "test-password",
    aclRole: UserRole.USER,
    name: "Test User",
    lastname: "Test Lastname",
    birthdate: new Date("1990-01-01"),
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

  // Devuelve el contexto de prueba
  return {
    prisma,
    user,
    meta: {
      remoteAddress: "127.0.0.1",
      remoteClientIdentity: undefined,
      source: undefined,
    },
  };
}

// Opcional: Puedes agregar funciones para inicializar y limpiar datos de prueba
export async function setupTestData() {
  // Aquí puedes crear datos de prueba en la base de datos
}

export async function cleanupTestData() {
  // Aquí puedes limpiar los datos de prueba de la base de datos
}
