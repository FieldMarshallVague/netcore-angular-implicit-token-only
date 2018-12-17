using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Scramjet.Identity.Extensions
{
    public static class ModelBuilderExtensions
    {
        public static void Seed(this ModelBuilder modelBuilder)
        {
            //modelBuilder.Entity<MyClass>().HasData(new MyClass{ Id = 1, Name = "..." });

            //modelBuilder.Entity<MyClassChild>().HasData(
            //    new MyClassChild { Id = 1, MyClassId = 1, Description = "Test1" },
            //    new MyClassChild { Id = 2, MyClassId = 1, Description = "Test2" }
            //);
        }
    }
}
