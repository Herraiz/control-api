import bcrypt from "bcrypt";

export default function signData(data: string): string {
  return bcrypt.hashSync(data, parseInt(process.env.SIGN_SECRET, 10));
}
