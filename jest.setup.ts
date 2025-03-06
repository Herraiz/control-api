// Existing Jest setup configuration

// Set mock environment variables for Mailjet
process.env.MJ_APIKEY_PUBLIC = "test_public_key";
process.env.MJ_APIKEY_PRIVATE = "test_private_key";

// Mock the Mailjet client
jest.mock("node-mailjet", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn().mockImplementation((resource: string) => {
          return {
            id: jest.fn().mockImplementation((email: string) => {
              return {
                request: jest.fn().mockResolvedValue({
                  body: {
                    Data: [
                      {
                        ID: "mock-user-id",
                        Email: email,
                      },
                    ],
                  },
                }),
              };
            }),
          };
        }),
        post: jest.fn().mockImplementation((resource: string) => {
          return {
            request: jest.fn().mockResolvedValue({
              body: {
                Sent: [
                  { Email: "test@example.com", MessageID: "mock-message-id" },
                ],
              },
            }),
          };
        }),
      };
    }),
  };
});

console.log("Mailjet API client mocked for testing");

// Mock the authorization files that actually exist in the project
jest.mock("./graphql/utils/authorizeFieldRequireAclPermission", () => 
jest.fn().mockImplementation(() => {
    return true; // Always return true for tests
})
);

jest.mock("./graphql/utils/authorizeFieldRequireUser", () => 
jest.fn().mockImplementation(() => {
    return true; // Always return true for tests
})
);

jest.mock("./graphql/utils/authorizeFieldCurrentUser", () => 
jest.fn().mockImplementation(() => {
    return true; // Always return true for tests
})
);

jest.mock("./graphql/utils/authorizeFieldUserIsAdmin", () => 
jest.fn().mockImplementation(() => {
    return true; // Always return true for tests
})
);

jest.mock("./graphql/utils/authorizeFieldRateLimiter", () => 
jest.fn().mockImplementation(() => {
    return true; // Always return true for tests
})
);

console.log("All authorization functions mocked for testing");

// Add declaration for extending GraphQL types with 'authorize' property
// This fixes the TypeScript error about 'authorize' not existing in MutationFieldConfig
declare global {
  namespace GraphQLModules {
    interface MutationFieldConfig<TName extends string = string> {
      authorize?: any;
    }
  }
}

// Mockea el plugin fieldAuthorizePlugin de Nexus
jest.mock("nexus/src/plugins/fieldAuthorizePlugin", () => ({
  fieldAuthorizePlugin: jest.fn().mockImplementation(() => ({
    // Implementa un plugin mock que siempre autoriza
    onCreateFieldResolver(config) {
      return async (root, args, ctx, info, next) => {
        // Siempre autoriza, sin verificar
        return next(root, args, ctx, info);
      };
    },
  })),
}));

// jest.setup.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Aquí puedes inicializar datos de prueba si es necesario
});

afterAll(async () => {
  await prisma.$disconnect();
});

global.prisma = prisma;

// Mock prettier to avoid the dynamic import error
jest.mock('prettier', () => ({
format: jest.fn(code => code),
resolveConfig: jest.fn().mockImplementation(() => Promise.resolve({}))
}));
