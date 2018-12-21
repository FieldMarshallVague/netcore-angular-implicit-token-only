README
======

These are some basic initial setup reminders

Migrations
-----------

Create migrations for aspnetidentity, config and persistedgrant stores.



First-Time Run
--------------

`dotnet ef migrations add initial_identity_migration -c ApplicationDbContext -o Data/Migrations/AspNetIdentity/ApplicationDb`
`dotnet ef migrations add initial_is4_server_config_migration -c ConfigurationDbContext -o Data/Migrations/IdentityServer/ConfigurationDb`
`dotnet ef migrations add initial_is4_persisted_grant_migration -c PersistedGrantDbContext -o Data/Migrations/IdentityServer/PersistedGrantDb`

`dotnet ef database update -c ApplicationDbContext`
`dotnet ef database update -c ConfigurationDbContext`
`dotnet ef database update -c PersistedGrantDbContext`

Seed the DB:
============

`dotnet run /seed`


The above command will seed the DB with some users.

Then run the actual project and the InitialiseDB method will run, adding roles, claims, clients etc based on the Config static object.












