
using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Mappers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Scramjet.Identity.Configuration.Constants;
using Scramjet.Identity.Configuration.Identity;
using Scramjet.Identity.Configuration.IdentityServer;
using Scramjet.Identity.Configuration.Interfaces;
using Scramjet.Identity.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Scramjet.Identity
{
    public static class AdminSeedData
    {
        /// <summary>
        /// Generate migrations before running this method, you can use command bellow:
        /// Nuget package manager: Add-Migration DbInit -context AdminDbContext -output Data/Migrations
        /// Dotnet CLI: dotnet ef migrations add DbInit -c AdminDbContext -o Data/Migrations
        /// </summary>
        /// <param name="host"></param>
        public static async Task EnsureSeedData(IWebHost host)
        {
            using (var serviceScope = host.Services.CreateScope())
            {
                var services = serviceScope.ServiceProvider;

                await EnsureSeedData(services);
            }
        }

        public static async Task EnsureSeedData(IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.GetRequiredService<IServiceScopeFactory>().CreateScope())
            {
                //var appContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var configContext = scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
                //var operationalContext = scope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

                var rootConfiguration = scope.ServiceProvider.GetRequiredService<IRootConfiguration>();

                // context.Database.Migrate(); 
                await EnsureSeedIdentityServerData(configContext, rootConfiguration.AdminConfiguration);
                await EnsureSeedIdentityData(userManager, roleManager);
            }
        }

        /// <summary>
        /// Generate default admin user / role
        /// </summary>
        private static async Task EnsureSeedIdentityData(UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // Create admin role
            if (!await roleManager.RoleExistsAsync(AuthorizationConsts.AdministrationRole))
            {
                var role = new IdentityRole { Name = AuthorizationConsts.AdministrationRole };

                await roleManager.CreateAsync(role);
            }

            // Create admin user
            if (await userManager.FindByNameAsync(Users.AdminUserName) != null) return;

            var user = new ApplicationUser
            {
                UserName = Users.AdminUserName,
                Email = Users.AdminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, Users.AdminPassword);

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, AuthorizationConsts.AdministrationRole);
            }
        }

        /// <summary>
        /// Generate default clients, identity and api resources
        /// </summary>
        private static async Task EnsureSeedIdentityServerData(ConfigurationDbContext configContext, IAdminConfiguration adminConfiguration)
        {
            if (!configContext.Clients.Any())
            {
                foreach (var client in Clients.GetAdminClient(adminConfiguration).ToList())
                {
                    await configContext.Clients.AddAsync(client.ToEntity());
                }

                await configContext.SaveChangesAsync();
            }

            if (!configContext.IdentityResources.Any())
            {
                var identityResources = ClientResources.GetIdentityResources().ToList();

                foreach (var resource in identityResources)
                {
                    await configContext.IdentityResources.AddAsync(resource.ToEntity());
                }

                await configContext.SaveChangesAsync();
            }

            if (!configContext.ApiResources.Any())
            {
                foreach (var resource in ClientResources.GetApiResources().ToList())
                {
                    await configContext.ApiResources.AddAsync(resource.ToEntity());
                }

                await configContext.SaveChangesAsync();
            }
        }
    }
}
