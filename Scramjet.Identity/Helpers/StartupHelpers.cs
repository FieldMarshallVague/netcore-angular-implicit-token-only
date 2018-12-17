using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Scramjet.Identity.Configuration;
using Scramjet.Identity.Configuration.Constants;
using Scramjet.Identity.Configuration.Interfaces;

namespace Scramjet.Identity.Helpers
{
    public static class StartupHelpers
    {
        public static IServiceCollection ConfigureRootConfiguration(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddOptions();

            services.Configure<AdminConfiguration>(configuration.GetSection(ConfigurationConsts.AdminConfigurationKey));

            services.TryAddSingleton<IRootConfiguration, RootConfiguration>();

            return services;
        }
    }
}
