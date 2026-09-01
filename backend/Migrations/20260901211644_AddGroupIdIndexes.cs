using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupIdIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Polls_GroupId",
                table: "Polls",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_GroupId",
                table: "Leads",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_UserId",
                table: "Groups",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Gifts_GroupId",
                table: "Gifts",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_GroupId",
                table: "Expenses",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_GroupId",
                table: "Events",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_DriveFolders_GroupId",
                table: "DriveFolders",
                column: "GroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Polls_GroupId",
                table: "Polls");

            migrationBuilder.DropIndex(
                name: "IX_Leads_GroupId",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Groups_UserId",
                table: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_Gifts_GroupId",
                table: "Gifts");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_GroupId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Events_GroupId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_DriveFolders_GroupId",
                table: "DriveFolders");
        }
    }
}
