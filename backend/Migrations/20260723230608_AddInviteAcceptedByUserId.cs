using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddInviteAcceptedByUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcceptedByUserId",
                table: "GroupInvites",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedByUserId",
                table: "GroupInvites");
        }
    }
}
