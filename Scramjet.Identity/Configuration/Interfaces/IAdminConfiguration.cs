﻿namespace Scramjet.Identity.Configuration.Interfaces
{
    public interface IAdminConfiguration
    {
        string IdentityAdminRedirectUri { get; }

        string IdentityServerBaseUrl { get; }

        string IdentityAdminBaseUrl { get; }
    }
}