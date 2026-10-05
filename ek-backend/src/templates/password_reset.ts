export const password_reset = ({ link }: { link: string }) => `
<!DOCTYPE html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Password</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: Arial, Helvetica, sans-serif;
      color: #18181b;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="background-color: #f4f4f5; padding: 40px 16px;"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              max-width: 520px;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  padding: 32px;
                  text-align: center;
                  background-color: #18181b;
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 600;
                  "
                >
                  Reset Your Password
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 36px 32px;">
                <p
                  style="
                    margin: 0 0 16px;
                    font-size: 16px;
                    line-height: 1.6;
                  "
                >
                  Hello,
                </p>

                <p
                  style="
                    margin: 0 0 24px;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #52525b;
                  "
                >
                  We received a request to reset the password for your
                  account. Click the button below to create a new password.
                </p>

                <!-- Button -->
                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin: 0 auto 28px;"
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        border-radius: 6px;
                        background-color: #18181b;
                      "
                    >
                      <a
                        href="${link}"
                        target="_blank"
                        style="
                          display: inline-block;
                          padding: 14px 28px;
                          font-size: 16px;
                          font-weight: 600;
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 6px;
                        "
                      >
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin: 0 0 12px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #71717a;
                  "
                >
                  This password reset link will expire in
                  <strong>15 minutes</strong>.
                </p>

                <p
                  style="
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #71717a;
                  "
                >
                  If you didn't request a password reset, you can safely
                  ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 24px 32px;
                  border-top: 1px solid #e4e4e7;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #a1a1aa;
                  "
                >
                  This is an automated email. Please do not reply to this
                  message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
`;
