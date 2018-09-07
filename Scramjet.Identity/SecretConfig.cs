using Microsoft.Extensions.Configuration;
using Scramjet.Identity.Models;
using SmartFormat;
using System;
using System.IO;

namespace Scramjet.Identity
{
    public sealed class SecretConfig
    {
        private static readonly Lazy<SecretConfig> lazy = new Lazy<SecretConfig>(() => new SecretConfig());

        private IConfiguration Configuration { get; set; }

        private SecretConfig() {
            GetConfiguration();
        }

        public static SecretConfig Instance {  get { return lazy.Value; } }
        
        /// <summary>
        /// Build the configuration with User Secrets and the 
        /// appsettings.json file for the connection string template.
        /// </summary>
        private void GetConfiguration()
        {
            var configBuilder = new ConfigurationBuilder()
               .SetBasePath(Directory.GetCurrentDirectory())
               .AddUserSecrets("Scramjet.Identity");

            Configuration = configBuilder.Build();
        }

        /// <summary>
        /// Bind the DB config data to the typed object
        /// and then parse the properties into the connection string template.
        /// </summary>
        /// <returns></returns>
        public string GetConnectionString()
        {
            // create DbOptions object to store the secrets in a statically-typed way
            var dbOptions = new DbOptions();
            // bind the config props to the optionss object
            Configuration.GetSection("DbOptions").Bind(dbOptions);

            // get the connection string template and parse the options object into it
            string conTemplate = Configuration["ConnectionStrings:AzureDevConnectionTemplate"];

            return Smart.Format(conTemplate, dbOptions);
        }

        public IConfigurationSection GetEmailSettings()
        {
            // create DbOptions object to store the secrets in a statically-typed way
            var emailSettings = new EmailSettings();
            // bind the config props to the optionss object
            Configuration.GetSection("EmailSettings").Bind(emailSettings);

            return Configuration.GetSection("EmailSettings");
        }
    }
}
