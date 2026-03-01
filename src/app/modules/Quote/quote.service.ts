import emailSender from "../../../helpers/emailSender";


interface SendQuotePayload {
  clientName: string;
  clientEmail: string;
  html: string;
  pdfBase64: string; // from frontend
}

const sendQuoteClient = async (payload: SendQuotePayload) => {
  const { clientName, clientEmail, html, pdfBase64 } = payload;
console.log(payload)
  // send email with PDF Base64
  await emailSender(
    `Quote for ${clientName}`,
    clientEmail,
    html,
    undefined,       // pdfBuffer (not using)
    undefined,       // pdfFilename
    pdfBase64        // pdfBase64 string
  );

  return {
    message: "Quote sent successfully",
    data: { clientName, clientEmail },
  };
};

export const QuoteService = {
  sendQuoteClient,
};