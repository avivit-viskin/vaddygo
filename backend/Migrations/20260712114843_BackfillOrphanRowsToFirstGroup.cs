using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class BackfillOrphanRowsToFirstGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            /* שיוך רשומות "יתומות" (GroupId==null) למוסד הראשון — כדי שלא ידלפו
               לכל מוסד אחרי שהסינון הפך קפדני. רשומות כאלה נוצרו לפני ריבוי-המוסדות
               או ע"י לקוח בלי כותרת X-Institution. אחרי השיוך הן מופיעות רק תחת
               המוסד הראשון (ולא נעלמות). מריצים שוב על כל הטבלאות ליתר ביטחון. */
            var backfill = "UPDATE {0} SET GroupId = (SELECT MIN(Id) FROM Groups) "
                + "WHERE GroupId IS NULL AND EXISTS (SELECT 1 FROM Groups);";
            migrationBuilder.Sql(string.Format(backfill, "Students"));
            migrationBuilder.Sql(string.Format(backfill, "StaffMembers"));
            migrationBuilder.Sql(string.Format(backfill, "Gifts"));
            migrationBuilder.Sql(string.Format(backfill, "Events"));
            migrationBuilder.Sql(string.Format(backfill, "DriveFolders"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
