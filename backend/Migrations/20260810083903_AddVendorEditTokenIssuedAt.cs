using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorEditTokenIssuedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EditTokenIssuedAt",
                table: "Vendors",
                type: "TEXT",
                nullable: true);

            // ספקים קיימים קיבלו את הקישור לפני שהתפוגה נוספה. מעניקים להם חלון
            // תוקף שמתחיל **עכשיו** (ולא null, שנחשב פג) — כדי שאף ספק פעיל לא
            // ייחסם ברגע הפריסה. מכאן ואילך התפוגה חלה עליהם כרגיל.
            migrationBuilder.Sql(
                "UPDATE Vendors SET EditTokenIssuedAt = CURRENT_TIMESTAMP " +
                "WHERE EditToken <> '' AND EditTokenIssuedAt IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditTokenIssuedAt",
                table: "Vendors");
        }
    }
}
