import { z } from "zod";

const createExpense = z.object({
  body: z.object({
    amount: z.number().min(1, "Amount is required."),
    category: z.string().nonempty("Category is required"),
    projectId: z.string().nonempty("Project is required"),
    description: z.string().optional(),
  }),
});

export const ExpensesValidation = {
  createExpense,
};
