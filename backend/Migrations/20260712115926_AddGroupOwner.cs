using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Groups",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // Backfill: גנים קיימים (ללא בעלים — UserId=0 מהתקופה שלפני הבעלות)
            // משויכים למשתמש הראשון (MIN(Users.Id) = חשבון בעלת המוצר), כדי שהנתונים
            // הקיימים ימשיכו להופיע לה — ורק לה. בטוח: פועל רק אם קיים משתמש.
            migrationBuilder.Sql(
                "UPDATE Groups SET UserId = (SELECT MIN(Id) FROM Users) " +
                "WHERE UserId = 0 AND EXISTS (SELECT 1 FROM Users);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Groups");
        }
    }
}
