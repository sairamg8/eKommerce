import { env } from "@/config/env";
import nodemailer from "nodemailer";

/**
 * Secure false is recommended
 * port with 587 and secure false for smtp because its conventional starttls configuration
 */

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: env.smtp_host,
  auth: {
    user: env.smtp_user,
    pass: env.smtp_password,
  },
  secure: false,
  port: env.smtp_port,
});

const trigger_email = async ({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}) => {
  try {
    await transporter.sendMail({
      from: env.smtp_from,
      to: email,
      subject,
      html: body,
    });
    return true;
  } catch (err) {
    return false;
  }
};

export default trigger_email;
