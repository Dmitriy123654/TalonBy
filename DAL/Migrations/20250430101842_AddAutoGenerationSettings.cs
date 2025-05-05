using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    public partial class AddAutoGenerationSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AutoGenerationSettings",
                columns: table => new
                {
                    AutoGenerationSettingsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PeriodType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NextGenerationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HospitalId = table.Column<int>(type: "int", nullable: true),
                    SpecialityId = table.Column<int>(type: "int", nullable: true),
                    DoctorId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScheduleSettingsJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutoGenerationSettings", x => x.AutoGenerationSettingsId);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutoGenerationSettings");
        }
    }
}
