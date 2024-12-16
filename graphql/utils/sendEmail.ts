import path from "path";
import ejs from "ejs";
import Mailjet, { Contact } from "node-mailjet";
import { parse } from "node-html-parser";

const mailjetClient = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE,
});

export async function subscribeUser(
  email: string,
  list: string,
): Promise<void> {
  await mailjetClient
    .post("contact")
    .id(email)
    .action("managecontactslists")
    .request({
      ContactsLists: [
        {
          ListID: list,
          Action: "addnoforce",
        },
      ],
    });
}
export async function unSubscribeUser(email: string): Promise<void> {
  const user = await mailjetClient.get("contact").id(email).request();

  await fetch(`https://api.mailjet.com/v4/contacts/${user.body.Data[0].ID}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.MJ_APIKEY_PUBLIC}:${process.env.MJ_APIKEY_PRIVATE}`,
        ).toString("base64"),
    },
  });
}

export default async function sendEmail(
  templateName: string,
  data: Record<string, unknown>,
  to: string,
  subject?: string,
  force = false,
): Promise<void> {
  try {
    const template = await ejs.renderFile(
      path.join(process.cwd(), `graphql/templates/${templateName}.ejs`),
      data,
    );

    const title =
      parse(template).getElementsByTagName("title")?.[0]?.textContent;
    // TODO - change lines when ready to deploy on production
    // if (force || process.env.SERVER_ENVIRONMENT === "production") {
    if (
      force ||
      ["production", "stage"].includes(process.env.SERVER_ENVIRONMENT)
    ) {
      await mailjetClient.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "info@gaminghub.gg",
              Name: "Gaming Hub",
            },
            To: [
              {
                Email: to,
              },
            ],
            Subject: subject || title,
            HTMLPart: template,
          },
        ],
      });
    } else {
      console.log("utils/sendEmail:", template);
    }
  } catch (error) {
    console.error("Unable to send activation email:", error);
  }
}
