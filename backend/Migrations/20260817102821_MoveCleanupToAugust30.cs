using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class MoveCleanupToAugust30 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // מועד הניקוי השנתי עבר מ-1 בספטמבר ל-30 באוגוסט (החלטת בעלת המוצר,
            // 17.08.2026). גנים קיימים כבר קיבלו מועד לפי הכלל הישן — מזיזים
            // אותם יומיים אחורה, כדי שלא יישארו שני מועדים שונים במערכת.
            // מטופלים רק מועדים ב-1 בספטמבר; מועד שהוגדר ידנית אינו משתנה.
            migrationBuilder.Sql(
                "UPDATE Groups SET NextCleanupAt = date(NextCleanupAt, '-2 day') " +
                "WHERE NextCleanupAt IS NOT NULL " +
                "AND strftime('%m-%d', NextCleanupAt) = '09-01';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
