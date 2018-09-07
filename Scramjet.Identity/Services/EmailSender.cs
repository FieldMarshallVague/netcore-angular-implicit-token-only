using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using Scramjet.Identity.Models;
using System.Threading.Tasks;

namespace Scramjet.Identity.Services
{
    public class EmailSender : IEmailSender
    {
        // todo: update this with app-specific email account.
        private const string SenderUserName = "scramjet.co.uk";
        private readonly IOptions<EmailSettings> _optionsEmailSettings;

        public EmailSender(IOptions<EmailSettings> optionsEmailSettings)
        {
            _optionsEmailSettings = optionsEmailSettings;
        }

        public async Task SendEmail(string email, string subject, string message, string toUsername)
        {
            var client = new SendGridClient(_optionsEmailSettings.Value.SendGridApiKey);
            var msg = new SendGridMessage();
            msg.SetFrom(new EmailAddress(_optionsEmailSettings.Value.SenderEmailAddress, SenderUserName));
            msg.AddTo(new EmailAddress(email, toUsername));
            msg.SetSubject(subject);
            msg.AddContent(MimeType.Text, message);
            //msg.AddContent(MimeType.Html, message);

            msg.SetReplyTo(new EmailAddress(_optionsEmailSettings.Value.SenderEmailAddress, SenderUserName));
            
            var response = await client.SendEmailAsync(msg);
        }
    }
}
