using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    public partial class AddTablesForPatientCard : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "NextAppointmentDate",
                table: "MedicalAppointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientCardId",
                table: "MedicalAppointments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PatientCards",
                columns: table => new
                {
                    PatientCardId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "date", nullable: false),
                    BloodType = table.Column<int>(type: "int", nullable: true),
                    LastUpdate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PatientId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientCards", x => x.PatientCardId);
                    table.ForeignKey(
                        name: "FK_PatientCards_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PatientAllergies",
                columns: table => new
                {
                    AllergyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientCardId = table.Column<int>(type: "int", nullable: false),
                    AllergyName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAllergies", x => x.AllergyId);
                    table.ForeignKey(
                        name: "FK_PatientAllergies_PatientCards_PatientCardId",
                        column: x => x.PatientCardId,
                        principalTable: "PatientCards",
                        principalColumn: "PatientCardId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatientChronicConditions",
                columns: table => new
                {
                    ConditionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientCardId = table.Column<int>(type: "int", nullable: false),
                    ConditionName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DiagnosedDate = table.Column<DateTime>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientChronicConditions", x => x.ConditionId);
                    table.ForeignKey(
                        name: "FK_PatientChronicConditions_PatientCards_PatientCardId",
                        column: x => x.PatientCardId,
                        principalTable: "PatientCards",
                        principalColumn: "PatientCardId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatientImmunizations",
                columns: table => new
                {
                    ImmunizationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientCardId = table.Column<int>(type: "int", nullable: false),
                    VaccineName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    VaccinationDate = table.Column<DateTime>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientImmunizations", x => x.ImmunizationId);
                    table.ForeignKey(
                        name: "FK_PatientImmunizations_PatientCards_PatientCardId",
                        column: x => x.PatientCardId,
                        principalTable: "PatientCards",
                        principalColumn: "PatientCardId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MedicalAppointments_PatientCardId",
                table: "MedicalAppointments",
                column: "PatientCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAllergies_PatientCardId",
                table: "PatientAllergies",
                column: "PatientCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientCards_PatientId",
                table: "PatientCards",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientChronicConditions_PatientCardId",
                table: "PatientChronicConditions",
                column: "PatientCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientImmunizations_PatientCardId",
                table: "PatientImmunizations",
                column: "PatientCardId");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicalAppointments_PatientCards_PatientCardId",
                table: "MedicalAppointments",
                column: "PatientCardId",
                principalTable: "PatientCards",
                principalColumn: "PatientCardId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MedicalAppointments_PatientCards_PatientCardId",
                table: "MedicalAppointments");

            migrationBuilder.DropTable(
                name: "PatientAllergies");

            migrationBuilder.DropTable(
                name: "PatientChronicConditions");

            migrationBuilder.DropTable(
                name: "PatientImmunizations");

            migrationBuilder.DropTable(
                name: "PatientCards");

            migrationBuilder.DropIndex(
                name: "IX_MedicalAppointments_PatientCardId",
                table: "MedicalAppointments");

            migrationBuilder.DropColumn(
                name: "NextAppointmentDate",
                table: "MedicalAppointments");

            migrationBuilder.DropColumn(
                name: "PatientCardId",
                table: "MedicalAppointments");
        }
    }
}
