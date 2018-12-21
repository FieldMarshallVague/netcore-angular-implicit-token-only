using IdentityModel;
using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Mappers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Scramjet.Identity.Data;
using Scramjet.Identity.Models;
using System;
using System.Linq;
using System.Reflection;
using System.Security.Claims;

namespace Scramjet.Identity
{
    public class SeedData
    {
        public static void EnsureSeedData(IConfiguration config, string connectionString)
        {
            IConfigurationSection stsConfig = config.GetSection("StsConfig");
            var migrationsAssembly = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            services.AddIdentityServer()
                // use db for storing config data
                .AddConfigurationStore(configDb =>
                {
                    configDb.ConfigureDbContext = db =>
                    {
                        db.EnableSensitiveDataLogging();
                        db.UseSqlServer(connectionString, sql => sql.MigrationsAssembly(migrationsAssembly));
                    };
                })
                // use db for storing operational data
                .AddOperationalStore(operationalDb =>
                {
                    operationalDb.ConfigureDbContext = db =>
                    {
                        db.EnableSensitiveDataLogging();
                        db.UseSqlServer(connectionString, sql => sql.MigrationsAssembly(migrationsAssembly));
                    };
                });

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            using (var serviceProvider = services.BuildServiceProvider())
            {
                using (var scope = serviceProvider.GetRequiredService<IServiceScopeFactory>().CreateScope())
                {
                    var context = scope.ServiceProvider.GetService<ApplicationDbContext>();
                    context.Database.Migrate();

                    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                    var alice = userMgr.FindByNameAsync("alice").Result;
                    if (alice == null)
                    {
                        alice = new ApplicationUser
                        {
                            UserName = "alice"
                        };
                        var result = userMgr.CreateAsync(alice, "Pa$$word123").Result;
                        if (!result.Succeeded)
                        {
                            throw new Exception(result.Errors.First().Description);
                        }

                        result = userMgr.AddClaimsAsync(alice, new Claim[]{
                            new Claim(JwtClaimTypes.Name, "Alice Smith"),
                            new Claim(JwtClaimTypes.GivenName, "Alice"),
                            new Claim(JwtClaimTypes.FamilyName, "Smith"),
                            new Claim(JwtClaimTypes.Email, "AliceSmith@email.com"),
                            new Claim(JwtClaimTypes.EmailVerified, "true", ClaimValueTypes.Boolean),
                            new Claim(JwtClaimTypes.WebSite, "http://alice.com"),
                            new Claim(JwtClaimTypes.Address, @"{ 'street_address': 'One Hacker Way', 'locality': 'Heidelberg', 'postal_code': 69118, 'country': 'Germany' }", IdentityServer4.IdentityServerConstants.ClaimValueTypes.Json)
                        }).Result;
                        if (!result.Succeeded)
                        {
                            throw new Exception(result.Errors.First().Description);
                        }
                        Console.WriteLine("alice created");
                    }
                    else
                    {
                        Console.WriteLine("alice already exists");
                    }

                    var bob = userMgr.FindByNameAsync("bob").Result;
                    if (bob == null)
                    {
                        bob = new ApplicationUser
                        {
                            UserName = "bob"
                        };
                        var result = userMgr.CreateAsync(bob, "Pa$$word123").Result;
                        if (!result.Succeeded)
                        {
                            throw new Exception(result.Errors.First().Description);
                        }

                        result = userMgr.AddClaimsAsync(bob, new Claim[]{
                            new Claim(JwtClaimTypes.Name, "Bob Smith"),
                            new Claim(JwtClaimTypes.GivenName, "Bob"),
                            new Claim(JwtClaimTypes.FamilyName, "Smith"),
                            new Claim(JwtClaimTypes.Email, "BobSmith@email.com"),
                            new Claim(JwtClaimTypes.EmailVerified, "true", ClaimValueTypes.Boolean),
                            new Claim(JwtClaimTypes.WebSite, "http://bob.com"),
                            new Claim(JwtClaimTypes.Address, @"{ 'street_address': 'One Hacker Way', 'locality': 'Heidelberg', 'postal_code': 69118, 'country': 'Germany' }", IdentityServer4.IdentityServerConstants.ClaimValueTypes.Json),
                            new Claim("location", "somewhere")
                        }).Result;
                        if (!result.Succeeded)
                        {
                            throw new Exception(result.Errors.First().Description);
                        }
                        Console.WriteLine("bob created");
                    }
                    else
                    {
                        Console.WriteLine("bob already exists");
                    }

                    // CONFIG

                    // create IS4 configuration database from migration if it doesn't exist
                    var configDbContext = scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
                    configDbContext.Database.Migrate();

                    // generate the records for Clients, IdentityResources () and APIs from the static config class.
                    if (!configDbContext.Clients.Any())
                    {
                        foreach (var client in Config.GetClients(stsConfig))
                        {
                            configDbContext.Clients.Add(client.ToEntity());
                        }

                        configDbContext.SaveChanges();
                    }


                    if (!configDbContext.IdentityResources.Any())
                    {
                        foreach (var res in Config.GetIdentityResources())
                        {
                            configDbContext.IdentityResources.Add(res.ToEntity());
                        }

                        configDbContext.SaveChanges();
                    }

                    if (!configDbContext.ApiResources.Any())
                    {
                        foreach (var api in Config.GetApiResources(SecretConfigDevelopment.Instance.GetIdentityServerSettings()))
                        {
                            configDbContext.ApiResources.Add(api.ToEntity());
                        }

                        configDbContext.SaveChanges();
                    }

                    // PERSISTED GRANTS

                    // create persistedGrant database from migration if it doesn't exist
                    var persistedGrantDbContext = scope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>();
                    persistedGrantDbContext.Database.Migrate();
                }
            }
        }
    }
}
