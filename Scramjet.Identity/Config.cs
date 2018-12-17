// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

using IdentityServer4.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace Scramjet.Identity
{
    public class Config
    {
        public static IEnumerable<IdentityResource> GetIdentityResources()
        {
            return new List<IdentityResource>
            {
                new IdentityResources.OpenId(),
                new IdentityResources.Profile(),
                new IdentityResources.Email(),
                new IdentityResource("dataeventrecordsscope",new []{ "role", "admin", "user", "dataEventRecords", "dataEventRecords.admin" , "dataEventRecords.user" } ),
                new IdentityResource("securedfilesscope",new []{ "role", "admin", "user", "securedFiles", "securedFiles.admin", "securedFiles.user"} )
            };
        }

        public static IEnumerable<ApiResource> GetApiResources(IConfigurationSection idsConfig)
        {
            var dataEventRecordsSecret = idsConfig["DataEventRecordsSecret"];
            var securedFilesSecret = idsConfig["SecuredFilesSecret"];

            return new List<ApiResource>
            {
                new ApiResource
                {
                    Name = "dataEventRecords",
                    DisplayName = "Scope for the dataEventRecords ApiResource",

                    ApiSecrets =
                    {
                        new Secret(dataEventRecordsSecret.Sha256())
                    },
                    Scopes =
                    {
                        new Scope()
                        {
                            Name = "dataeventrecords",
                            DisplayName = "Scope for the dataEventRecords ApiResource"
                        }
                    },
                    UserClaims = { "role", "admin", "user", "dataEventRecords", "dataEventRecords.admin", "dataEventRecords.user" }
                },
                new ApiResource
                {
                    Name = "securedFiles",
                    DisplayName = "Scope for the securedFiles ApiResource",

                    ApiSecrets =
                    {
                        new Secret(securedFilesSecret.Sha256())
                    },
                    Scopes =
                    {
                        new Scope()
                        {
                            Name = "securedfiles",
                            DisplayName = "Scope for the securedFiles ApiResource"
                        }
                    },
                    UserClaims = { "role", "admin", "user", "securedFiles", "securedFiles.admin", "securedFiles.user" }
                }
            };
        }

        // clients want to access resources (aka scopes)
        public static IEnumerable<Client> GetClients(IConfigurationSection stsConfig)
        {
            var AngularClientUrl = stsConfig["AngularClientUrl"];
            var AngularClientSecureUrl = stsConfig["AngularClientSecureUrl"];

            var AngularClientIdTokenOnlyUrl = stsConfig["AngularClientIdTokenOnlyUrl"];
            var AngularClientIdTokenOnlySecureUrl = stsConfig["AngularClientIdTokenOnlySecureUrl"];
            // TODO use configs in app

            // client credentials client
            return new List<Client>
            {
                new Client
                {
                    ClientName = "angularclient",
                    ClientId = "angularclient",
                    AccessTokenType = AccessTokenType.Reference,
                    AccessTokenLifetime = 7200,// 120 seconds, default 60 minutes
                    IdentityTokenLifetime = 7200,
                    AllowedGrantTypes = GrantTypes.Implicit,
                    AlwaysIncludeUserClaimsInIdToken = true,
                    AllowAccessTokensViaBrowser = true,
                    RedirectUris = new List<string>
                    {
                        AngularClientSecureUrl,
                        AngularClientSecureUrl + "/silent-renew.html"

                    },
                    PostLogoutRedirectUris = new List<string>
                    {
                        AngularClientSecureUrl + "/Unauthorized"
                    },
                    AllowedCorsOrigins = new List<string>
                    {
                        AngularClientSecureUrl,
                        AngularClientUrl
                    },
                    AllowedScopes = new List<string>
                    {
                        "openid",
                        "dataEventRecords",
                        "dataeventrecordsscope",
                        "securedFiles",
                        "securedfilesscope",
                        "role",
                        "profile",
                        "email"
                    }
                },
                new Client
                {
                    ClientName = "angularclientidtokenonly",
                    ClientId = "angularclientidtokenonly",
                    AccessTokenType = AccessTokenType.Reference,
                    AccessTokenLifetime = 7200,// 120 seconds, default 60 minutes
                    IdentityTokenLifetime = 7200,
                    AllowedGrantTypes = GrantTypes.Implicit,
                    AlwaysIncludeUserClaimsInIdToken = true,
                    AllowAccessTokensViaBrowser = true,
                    RedirectUris = new List<string>
                    {
                        AngularClientIdTokenOnlySecureUrl,
                        AngularClientIdTokenOnlySecureUrl + "/silent-renew.html"

                    },
                    PostLogoutRedirectUris = new List<string>
                    {
                        AngularClientIdTokenOnlySecureUrl + "/Unauthorized"
                    },
                    AllowedCorsOrigins = new List<string>
                    {
                        AngularClientIdTokenOnlySecureUrl,
                        AngularClientIdTokenOnlyUrl
                    },
                    AllowedScopes = new List<string>
                    {
                        "openid",
                        "dataEventRecords",
                        "dataeventrecordsscope",
                        "securedFiles",
                        "securedfilesscope",
                        "role",
                        "profile",
                        "email"
                    }
                }
            };
        }
    }
}