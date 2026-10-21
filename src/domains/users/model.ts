/** A user: someone who writes articles and comments (What) */
import { z } from "zod";

declare const userIdBrand: unique symbol;
export type UserId = string & { readonly [userIdBrand]: true };
export const userId = (value: string) => value as UserId;
export const newUserId = () => userId(crypto.randomUUID());
export const userIdSchema = z.string().min(1).transform(userId);

export type User = {
  id: UserId;
  name: string;
  createdAt: Date;
};

export const userInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
});
export type UserInput = z.infer<typeof userInputSchema>;
