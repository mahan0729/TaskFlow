using SendGrid;
using SendGrid.Helpers.Mail;

namespace TaskFlow.API.Services;

public class SendGridEmailService(IConfiguration config) : IEmailService
{
    public Task SendVerificationEmailAsync(string toEmail, string name, string code) =>
        SendAsync(toEmail, name,
            subject: "Verify your TaskFlow email",
            heading: "Verify your email",
            body: $"Hi {name}, enter this code to activate your TaskFlow account:",
            code: code,
            footer: "This code expires in 30 minutes. If you didn't create a TaskFlow account, you can safely ignore this email.");

    public Task SendPasswordResetEmailAsync(string toEmail, string name, string code) =>
        SendAsync(toEmail, name,
            subject: "Reset your TaskFlow password",
            heading: "Reset your password",
            body: $"Hi {name}, enter this code to set a new password:",
            code: code,
            footer: "This code expires in 30 minutes. If you didn't request this, you can safely ignore this email.");

    public async Task SendDownloadEmailAsync(string toEmail, string name, string windowsUrl)
    {
        var apiKey = config["SendGrid:ApiKey"];
        var fromEmail = config["SendGrid:FromEmail"] ?? "noreply@taskflow.app";
        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromEmail, "TaskFlow");
        var to = new EmailAddress(toEmail, name);

        var html = $"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
              <div style="background:#1d4ed8;padding:16px;border-radius:12px 12px 0 0;text-align:center">
                <span style="color:white;font-weight:900;font-size:22px">TF</span>
                <span style="color:#bfdbfe;font-weight:bold;font-size:16px;margin-left:8px">TaskFlow</span>
              </div>
              <div style="background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
                <h2 style="color:#1e293b;margin:0 0 8px">Download TaskFlow for Windows</h2>
                <p style="color:#64748b">Hi {name}, your TaskFlow desktop app is ready to download.</p>
                <div style="text-align:center;padding:24px 0">
                  <a href="{windowsUrl}" style="display:inline-block;background:#1d4ed8;color:white;font-weight:700;font-size:16px;padding:14px 32px;border-radius:10px;text-decoration:none">
                    Download for Windows
                  </a>
                </div>
                <h3 style="color:#1e293b;font-size:14px;margin:0 0 8px">Installation Instructions</h3>
                <ol style="color:#64748b;font-size:13px;padding-left:20px;line-height:1.8">
                  <li>Click the button above to download the installer (.exe).</li>
                  <li>If Windows SmartScreen appears, click <strong>More info</strong> then <strong>Run anyway</strong>.</li>
                  <li>Follow the setup wizard — TaskFlow will launch automatically when complete.</li>
                  <li>Sign in with your existing TaskFlow account credentials.</li>
                </ol>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px">
                  Questions? Reply to this email or visit your Help page inside the app.
                </p>
              </div>
            </div>
            """;

        var msg = MailHelper.CreateSingleEmail(from, to,
            subject: "Your TaskFlow Desktop App is Ready",
            plainTextContent: $"Download TaskFlow for Windows: {windowsUrl}\n\nInstallation: Download the .exe, allow it through SmartScreen, follow the wizard, then sign in with your existing credentials.",
            htmlContent: html);

        await client.SendEmailAsync(msg);
    }

    private async Task SendAsync(string toEmail, string name, string subject, string heading, string body, string code, string footer)
    {
        var apiKey = config["SendGrid:ApiKey"];
        var fromEmail = config["SendGrid:FromEmail"] ?? "noreply@taskflow.app";

        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromEmail, "TaskFlow");
        var to = new EmailAddress(toEmail, name);

        var msg = MailHelper.CreateSingleEmail(
            from, to, subject,
            plainTextContent: $"{heading}\n\n{body}\n\n{code}\n\n{footer}",
            htmlContent: BuildHtml(heading, body, code, footer));

        await client.SendEmailAsync(msg);
    }

    private static string BuildHtml(string heading, string body, string code, string footer) => $"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#1d4ed8;padding:16px;border-radius:12px 12px 0 0;text-align:center">
            <span style="color:white;font-weight:900;font-size:22px">TF</span>
            <span style="color:#bfdbfe;font-weight:bold;font-size:16px;margin-left:8px">TaskFlow</span>
          </div>
          <div style="background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <h2 style="color:#1e293b;margin:0 0 8px">{heading}</h2>
            <p style="color:#64748b">{body}</p>
            <div style="text-align:center;padding:24px 0">
              <div style="display:inline-block;font-size:40px;font-weight:900;letter-spacing:12px;color:#1d4ed8;background:#eff6ff;padding:16px 24px;border-radius:12px;border:2px solid #bfdbfe">{code}</div>
            </div>
            <p style="color:#94a3b8;font-size:13px;text-align:center">{footer}</p>
          </div>
        </div>
        """;
}
