using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Serilog;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Scramjet.Identity
{
    public class Program
    {
        public static IConfiguration Configuration { get; } = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        public static async Task<int> Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(Configuration)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .CreateLogger();

            var seed = args.Any(x => x == "/seed");
            //seed = true;
            if (seed) args = args.Except(new[] { "/seed" }).ToArray();

            try
            {
                Log.Information("Starting web host");

                var host = BuildWebHost(args);

                if (seed)
                {
                    Log.Information("Seding DB with IS4 data");
                    // do IS4 data first
                    SeedData.EnsureSeedData(Configuration, SecretConfigDevelopment.Instance.GetConnectionString());

                    // then do admin ui data
                    Log.Information("Seding DB with Admin UI data");
                    await AdminSeedData.EnsureSeedData(host);

                    // exit early to allow seed-only run
                    return 1;
                }

                host.Run();

                return 0;
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Host terminated unexpectedly");
                return 1;
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
            .UseStartup<Startup>()
                .UseSerilog()
                .Build();
    }
}
