﻿using Microsoft.Extensions.Localization;
using System.Reflection;

namespace Scramjet.Identity.Resources
{
    public class LocalizerService
    {
        private readonly IStringLocalizer _localizer;

        public LocalizerService(IStringLocalizerFactory factory)
        {
            var type = typeof(SharedResource);
            var assemblyName = new AssemblyName(type.GetTypeInfo().Assembly.FullName);
            _localizer = factory.Create("SharedResource", assemblyName.Name);
        }

        public LocalizedString GetLocalizedHtmlString(string key)
        {
            return _localizer[key];
        }
    }
}