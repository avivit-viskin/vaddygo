using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorCategoryCity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Vendors",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Vendors",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Vendors");
        }
    }
}
