import nodemailer from "nodemailer";
import config from "../config";
import ApiError from "../errors/ApiErrors";

const emailSender = async (
  subject: string,
  email: string,
  html: string,
  pdfBuffer?: Buffer,       // optional PDF buffer
  pdfFilename?: string,
  pdfBase64?: string        // optional Base64 PDF
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  const mailOptions: any = {
    from: `"Surfside Staging" <${config.emailSender.email}>`,
    to: email,
    subject,
    html,
  };

  // Attach PDF
  if (pdfBuffer && pdfFilename) {
    mailOptions.attachments = [
      { filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" },
    ];
  } else if (pdfBase64) {
    mailOptions.attachments = [
      { filename: "Quote.pdf", content: pdfBase64, encoding: "base64", contentType: "application/pdf" },
    ];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new ApiError(500, "Error sending email");
  }
};

export default emailSender;

export const emailSenderForContact = async (
  subject: string,
  email: string,
  html: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  const emailTransport = transporter;

  const mailOptions = {
    from: `"CORVERA" <${email}>`,
    to: config.emailSender.email,
    subject,
    html,
  };

  // Send the email
  try {
    const info = await emailTransport.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new ApiError(500, "Error sending email");
  }
};
