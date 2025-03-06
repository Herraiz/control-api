import { nonNull, queryField, stringArg } from "nexus";
import OpenAI from "openai";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactionClassification", {
  type: "Transaction",
  args: {
    transactionText: nonNull(stringArg()),
    userId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { transactionText, userId }, ctx) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        budgets: {
          select: {
            name: true,
            id: true,
          },
        },
        debts: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    console.log(user);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [{ role: "developer", content: "write a haiku about ai" }],
    });

    completion.then((result) => console.log(result.choices[0].message));

    // return custom transaction mock
    return {
      id: "1",
      name: transactionText,
      date: new Date(),
      amount: 100,
      type: "EXPENSE",
      category: "ENTERTAINMENT",
      userId,
      budgetId: "1",
    };
  },
});
