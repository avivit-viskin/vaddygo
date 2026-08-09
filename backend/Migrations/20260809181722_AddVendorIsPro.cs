using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorIsPro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPro",
                table: "Vendors",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPro",
                table: "Vendors");
        }
    }
}
