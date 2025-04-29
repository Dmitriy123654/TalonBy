using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    public partial class addAppointmentDetailsAndChangeRelationship : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppointmentMedicalDetails",
                columns: table => new
                {
                    AppointmentMedicalDetailsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MedicalAppointmentId = table.Column<int>(type: "int", nullable: false),
                    Diagnosis = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Treatment = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                    Prescriptions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LabResults = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    MedicalHistory = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Allergies = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    VitalSigns = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NextAppointmentDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentMedicalDetails", x => x.AppointmentMedicalDetailsId);
                    table.ForeignKey(
                        name: "FK_AppointmentMedicalDetails_MedicalAppointments_MedicalAppointmentId",
                        column: x => x.MedicalAppointmentId,
                        principalTable: "MedicalAppointments",
                        principalColumn: "MedicalAppointmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentMedicalDetails_MedicalAppointmentId",
                table: "AppointmentMedicalDetails",
                column: "MedicalAppointmentId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppointmentMedicalDetails");
        }
    }
}
