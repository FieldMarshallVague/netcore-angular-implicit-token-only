﻿using IdentityServer4.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.KeyVault;
using Microsoft.Azure.Services.AppAuthentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.AzureKeyVault;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Scramjet.Identity.Data;
using Scramjet.Identity.Models;
using Scramjet.Identity.Resources;
using Scramjet.Identity.Services;
using Scramjet.Identity.Services.Certificate;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;

namespace Scramjet.Identity
{
    public class StartupProduction
    {
        private static string GetKeyVaultEndpoint() => "https://angciety.vault.azure.net";
        private readonly IHostingEnvironment _environment;

        public StartupProduction(IHostingEnvironment env)
        {
            _environment = env;

            var configBuilder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            // todo: move this to a StartupProduction class (and have an equivalent StartupDevelopment class)
            if (_environment.IsProduction())
            {
                var keyVaultEndpoint = GetKeyVaultEndpoint();
                if (!string.IsNullOrEmpty(keyVaultEndpoint))
                {
                    var azureServiceTokenProvider = new AzureServiceTokenProvider();
                    var keyVaultClient = new KeyVaultClient(
                        new KeyVaultClient.AuthenticationCallback(azureServiceTokenProvider.KeyVaultTokenCallback));
                    configBuilder.AddAzureKeyVault(keyVaultEndpoint, keyVaultClient, new DefaultKeyVaultSecretManager());
                }
            }

            configBuilder.AddEnvironmentVariables();
            Configuration = configBuilder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            var stsConfig = Configuration.GetSection("StsConfig");
            var useLocalCertStore = Convert.ToBoolean(Configuration["UseLocalCertStore"]);
            var certificateThumbprint = Configuration["CertificateThumbprint"];

            X509Certificate2 cert;

            if (_environment.IsProduction())
            {
                if (useLocalCertStore)
                {
                    using (X509Store store = new X509Store(StoreName.My, StoreLocation.LocalMachine))
                    {
                        store.Open(OpenFlags.ReadOnly);
                        var certs = store.Certificates.Find(X509FindType.FindByThumbprint, certificateThumbprint, false);
                        cert = certs[0];
                        store.Close();
                    }
                }
                else
                {
                    // Azure deployment, will be used if deployed to Azure
                    var vaultConfigSection = Configuration.GetSection("Vault");
                    var keyVaultService = new KeyVaultCertificateService(vaultConfigSection["Url"], vaultConfigSection["ClientId"], vaultConfigSection["ClientSecret"]);
                    cert = keyVaultService.GetCertificateFromKeyVault(vaultConfigSection["CertificateName"]);
                }
            }
            else
            {
                cert = new X509Certificate2(Path.Combine(_environment.ContentRootPath, "damienbodserver.pfx"), "");
            }

            //services.AddDbContext<ApplicationDbContext>(options =>
            //{
            //    options.UseSqlServer(SecretConfigDevelopment.Instance.GetConnectionString());
            //});

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(Configuration.GetConnectionString("DefaultConnection")));

            services.Configure<StsConfig>(Configuration.GetSection("StsConfig"));

            //services.Configure<EmailSettings>(Configuration.GetSection("EmailSettings"));
            services.Configure<EmailSettings>(SecretConfigDevelopment.Instance.GetEmailSettings());

            services.AddSingleton<LocalizerService>();
            services.AddLocalization(options => options.ResourcesPath = "Resources");

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

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

            services.AddIdentityServer()
                .AddSigningCredential(cert)
                .AddInMemoryIdentityResources(Config.GetIdentityResources())
                .AddInMemoryApiResources(Config.GetApiResources(SecretConfigDevelopment.Instance.GetIdentityServerSettings()))
                .AddInMemoryClients(Config.GetClients(stsConfig))
                .AddAspNetIdentity<ApplicationUser>()
                .AddProfileService<IdentityWithAdditionalClaimsProfileService>();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
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
    }
}
