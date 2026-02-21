export interface IUpdateExpenseStatus {
  expenseId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback?: string;
}
