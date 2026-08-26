using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /*
      SweepRemaining2026Cleanups — סריקה שנייה שמוודאת שאף גן אינו מתוזמן
      למחיקה ב-30.08.2026.

      למה נדרשה עוד אחת: המיגרציה הקודמת (SkipFirstYearCleanup) דחתה את הגנים
      שהיו קיימים באותו רגע, אבל **הכלל שקובע מועד לגן חדש נשאר "ה-30.8 הקרוב"**
      — ולכן כל גן שנוצר מאז קיבל שוב את 2026, ראה מיד באנר "הנתונים יימחקו",
      והיה נמחק בפועל. דווח על מוסד שנוצר היום.

      התיקון השלם הוא בשני חלקים: הכלל עצמו (רצפה ב-YearEndCleanupService,
      שאינו מתזמן לפני 30.08.2027) והסריקה הזאת, שמנקה את מה שכבר נכתב.

      אידמפוטנטית: הרצה חוזרת על מסד נקי אינה משנה דבר.
    */
    public partial class SweepRemaining2026Cleanups : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE Groups
                SET NextCleanupAt = '2027-08-30 00:00:00',
                    CleanupWarnedAt = NULL
                WHERE NextCleanupAt IS NOT NULL
                  AND NextCleanupAt < '2027-01-01';
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // אין החזרה: שחזור המועד ל-2026 היה מחזיר מחיקה שבוטלה בכוונה.
        }
    }
}
