using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    public partial class UpdateScheduleModels : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_HospitalId",
                table: "TimeSlots",
                column: "HospitalId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_Hospitals_HospitalId",
                table: "TimeSlots",
                column: "HospitalId",
                principalTable: "Hospitals",
                principalColumn: "HospitalId",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_Hospitals_HospitalId",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_HospitalId",
                table: "TimeSlots");
        }
    }
}
