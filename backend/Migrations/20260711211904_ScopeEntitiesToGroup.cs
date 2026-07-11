using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class ScopeEntitiesToGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Gifts",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Events",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "DriveFolders",
                type: "INTEGER",
                nullable: true);

            /* שיוך רשומות קיימות (בלי שיוך) למוסד הראשון — כדי שמוסד חדש יתחיל ריק
               ולא "יירש" צוות/מתנות/אירועים/תיקיות מהמוסד הראשון (הכלל של null=כולם).
               StaffMembers.GroupId כבר קיים כעמודה אך מעולם לא אוכלס — ממלאים גם אותו. */
            var backfill = "UPDATE {0} SET GroupId = (SELECT MIN(Id) FROM Groups) "
                + "WHERE GroupId IS NULL AND EXISTS (SELECT 1 FROM Groups);";
            migrationBuilder.Sql(string.Format(backfill, "Gifts"));
            migrationBuilder.Sql(string.Format(backfill, "Events"));
            migrationBuilder.Sql(string.Format(backfill, "DriveFolders"));
            migrationBuilder.Sql(string.Format(backfill, "StaffMembers"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Gifts");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "DriveFolders");
        }
    }
}
