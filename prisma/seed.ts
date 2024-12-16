import { PrismaClient } from "@prisma/client";
import signData from "../graphql/utils/signData";

const prisma = new PrismaClient();

async function main() {
  /* ADMIN ############################## */
  /* ############################## */

  const userAdmin = await prisma.user.create({
    data: {
      email: "admin@pokeapp.es",
      password: signData(`admin@pokeapp.es:admin`),
      newsletterOptIn: false,
      aclRole: "ADMIN",
    },
  });

  /* ############################## */
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
