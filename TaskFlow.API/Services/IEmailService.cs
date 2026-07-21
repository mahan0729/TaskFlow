namespace TaskFlow.API.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string name, string code);
    Task SendPasswordResetEmailAsync(string toEmail, string name, string code);
}
