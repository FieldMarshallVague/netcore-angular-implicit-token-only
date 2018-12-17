using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Mappers;
using IdentityServer4.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Scramjet.Identity.Configuration.Interfaces;
using Scramjet.Identity.Data;
using Scramjet.Identity.Helpers;
using Scramjet.Identity.Models;
using Scramjet.Identity.Resources;
using Scramjet.Identity.Services;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;

namespace Scramjet.Identity
{
    public class Startup
    {
        private readonly IHostingEnvironment _environment;
        private readonly IConfigurationSection _stsConfig;

        public Startup(IHostingEnvironment env)
        {
            _environment = env;

            var configBuilder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            configBuilder.AddEnvironmentVariables();
            Configuration = configBuilder.Build();
            _stsConfig = Configuration.GetSection("StsConfig");
        }

        public IConfigurationRoot Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {

            services.ConfigureRootConfiguration(Configuration);
            var rootConfiguration = services.BuildServiceProvider().GetService<IRootConfiguration>();

            var connectionString = SecretConfigDevelopment.Instance.GetConnectionString();
            var migrationsAssembly = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;

            //var useLocalCertStore = Convert.ToBoolean(Configuration["UseLocalCertStore"]);
            //var certificateThumbprint = Configuration["CertificateThumbprint"];

            //X509Certificate2 cert;

            //if (_environment.IsProduction() )
            //{
            //    if (useLocalCertStore)
            //    {
            //        using (X509Store store = new X509Store(StoreName.My, StoreLocation.LocalMachine))
            //        {
            //            store.Open(OpenFlags.ReadOnly);
            //            var certs = store.Certificates.Find(X509FindType.FindByThumbprint, certificateThumbprint, false);
            //            cert = certs[0];
            //            store.Close();
            //        }
            //    }
            //    else
            //    {
            //        // Azure deployment, will be used if deployed to Azure
            //        var vaultConfigSection = Configuration.GetSection("Vault");
            //        var keyVaultService = new KeyVaultCertificateService(vaultConfigSection["Url"], vaultConfigSection["ClientId"], vaultConfigSection["ClientSecret"]);
            //        cert = keyVaultService.GetCertificateFromKeyVault(vaultConfigSection["CertificateName"]);
            //    }
            //}
            //else
            //{
            //    cert = new X509Certificate2(Path.Combine(_environment.ContentRootPath, "damienbodserver.pfx"), "");
            //    Log.Warning("Replace the default Cert file (PFX) with custom-created one.");
            //}

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.EnableSensitiveDataLogging(true);
                options.UseSqlServer(connectionString);
            });

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            services.Configure<StsConfig>(Configuration.GetSection("StsConfig"));

            //services.Configure<EmailSettings>(Configuration.GetSection("EmailSettings"));
            services.Configure<EmailSettings>(SecretConfigDevelopment.Instance.GetEmailSettings());

            // Localisation
            services.AddSingleton<LocalizerService>();
            services.AddLocalization(options => options.ResourcesPath = "Resources");
            services.Configure<RequestLocalizationOptions>(
                options =>
                {
                    var supportedCultures = new List<CultureInfo>
                        {
                            new CultureInfo("en-GB"),
                            new CultureInfo("en-US"),
                            new CultureInfo("de-CH"),
                            new CultureInfo("fr-CH"),
                            new CultureInfo("it-CH")
                        };

                    options.DefaultRequestCulture = new RequestCulture(culture: "en-GB", uiCulture: "en-GB");
                    options.SupportedCultures = supportedCultures;
                    options.SupportedUICultures = supportedCultures;

                    var providerQuery = new LocalizationQueryProvider
                    {
                        QureyParamterName = "ui_locales"
                    };

                    // Cookie is required for the logout, query parameters at not supported with the endsession endpoint
                    // Only works in the same domain
                    var providerCookie = new LocalizationCookieProvider
                    {
                        CookieName = "defaultLocale"
                    };
                    // options.RequestCultureProviders.Insert(0, providerCookie);
                    options.RequestCultureProviders.Insert(0, providerQuery);
                });

            // MVC
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1)
                .AddViewLocalization()
                .AddDataAnnotationsLocalization(options =>
                {
                    options.DataAnnotationLocalizerProvider = (type, factory) =>
                    {
                        var assemblyName = new AssemblyName(typeof(SharedResource).GetTypeInfo().Assembly.FullName);
                        return factory.Create("SharedResource", assemblyName.Name);
                    };
                });

            services.AddTransient<IProfileService, IdentityWithAdditionalClaimsProfileService>();

            services.AddTransient<IEmailSender, EmailSender>();

            // IS4
            var builder = services.AddIdentityServer()
                //.AddSigningCredential(cert) // todo: check if this is what's used for data properties encryption?  e.g. sensitive input from user
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
                })
                .AddAspNetIdentity<ApplicationUser>()
                .AddProfileService<IdentityWithAdditionalClaimsProfileService>();
            
            if (_environment.IsDevelopment())
            {
                builder.AddDeveloperSigningCredential();
            }
            else
            {
                throw new Exception("need to configure key material");
            }
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            InitialiseDatabase(app);

            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            var locOptions = app.ApplicationServices.GetService<IOptions<RequestLocalizationOptions>>();
            app.UseRequestLocalization(locOptions.Value);

            app.UseStaticFiles();
            app.UseIdentityServer();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }


        /// <summary>
        /// Seed the data initially
        /// </summary>
        /// <param name="app"></param>
        private void InitialiseDatabase(IApplicationBuilder app)
        {
            // using a services scope
            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {

                // create persistedGrant database from migration if it doesn't exist
                //var persistedGrantDbContext = serviceScope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>();
                //persistedGrantDbContext.Database.Migrate();

                // create IS4 configuration database from migration if it doesn't exist
                var configDbContext = serviceScope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
                //configDbContext.Database.Migrate();

                // genereat the records for Clients, IdentityResources () and APIs from the static config class.
                if (!configDbContext.Clients.Any())
                {
                    foreach (var client in Config.GetClients(_stsConfig))
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
            }
        }
    }
}
