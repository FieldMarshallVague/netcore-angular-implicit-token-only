namespace Scramjet.Identity.Models
{
    public class IdentityServerSettings
    {
        public string DataEventRecordsSecret { get; set; }
        public string SecuredFilesSecret { get; set; }
        public string CertificatePassword { get; set; }
    }
}
