using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierReportDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "VendorProducts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VendorViewDays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    VendorId = table.Column<int>(type: "INTEGER", nullable: false),
                    Day = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Count = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorViewDays", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorViewDays_VendorId_Day",
                table: "VendorViewDays",
                columns: new[] { "VendorId", "Day" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorViewDays");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "VendorProducts");
        }
    }
}
