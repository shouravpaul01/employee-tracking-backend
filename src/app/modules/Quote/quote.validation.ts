import { z } from "zod";

const sendQuoteSchema = z.object({
  body: z.object({
    clientName: z.string().nonempty("Client name is required"),
    clientEmail: z.string().email("Invalid email address"),
    pdfBase64: z.string().nonempty("PDF is required"),
    quoteNumber: z.string().optional(),
    quoteDate: z.string().optional(),
    totalAmount: z.number().optional(),
  }),
});

export const QuoteValidation = {
  sendQuoteSchema,
};
