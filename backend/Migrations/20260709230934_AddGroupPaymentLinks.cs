using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupPaymentLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BitLink",
                table: "Groups",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayboxLink",
                table: "Groups",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BitLink",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "PayboxLink",
                table: "Groups");
        }
    }
}
