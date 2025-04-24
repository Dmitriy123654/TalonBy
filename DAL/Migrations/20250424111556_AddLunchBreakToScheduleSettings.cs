using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    public partial class AddLunchBreakToScheduleSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LunchBreak",
                table: "DoctorScheduleSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "LunchEnd",
                table: "DoctorScheduleSettings",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "LunchStart",
                table: "DoctorScheduleSettings",
                type: "time",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LunchBreak",
                table: "DoctorScheduleSettings");

            migrationBuilder.DropColumn(
                name: "LunchEnd",
                table: "DoctorScheduleSettings");

            migrationBuilder.DropColumn(
                name: "LunchStart",
                table: "DoctorScheduleSettings");
        }
    }
}
