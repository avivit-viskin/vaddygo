using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class BackfillStudentGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // מעבר לריבוי מוסדות: משייכים תלמידים קיימים ללא שיוך למוסד הראשון,
            // כדי שיישארו גלויים כשהמוסד הראשון פעיל וייכללו בהפרדה בין מוסדות.
            // בטוח: מעדכן רק תלמידים ללא שיוך, ורק אם קיים מוסד כלשהו.
            migrationBuilder.Sql(
                "UPDATE Students SET GroupId = (SELECT MIN(Id) FROM Groups) " +
                "WHERE GroupId IS NULL AND EXISTS (SELECT 1 FROM Groups);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // אין החזרה — לא מאבדים את השיוך שנוצר.
        }
    }
}
