using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /*
      SkipFirstYearCleanup — דוחה את מחיקת סוף השנה של 30.08.2026 בשנה.

      הרקע (החלטת בעלת המוצר, 23.08.2026): הוועדים נכנסו למערכת רק בשבועות
      האחרונים. מחיקה אוטומטית של כל נתוני השנה שבעה ימים אחרי שהם התחילו
      להזין תלמידים ותשלומים הייתה מוחקת בדיוק את העבודה שהרגע עשו — ונראית
      להם כאובדן נתונים, לא כמדיניות.

      מה נעשה כאן:
      • כל גן שמועד הניקוי שלו נופל בשנת 2026 נדחה ל-30.08.2027.
      • ‏CleanupWarnedAt מאופס — כדי שהתראת המייל של המחזור הבא תישלח כרגיל
        בזמנה. בלי האיפוס, גן שכבר קיבל התראה השנה לא היה מקבל אותה שוב לעולם.

      מכוון לשנת 2026 בלבד ולא "כל הגנים": מי שכבר נדחה ל-2027 או הלאה לא
      נדחף עוד שנה קדימה בטעות.

      זו דחייה חד-פעמית — המדיניות עצמה (30.8 בכל שנה) לא משתנה.
    */
    public partial class SkipFirstYearCleanup : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE Groups
                SET NextCleanupAt = '2027-08-30 00:00:00',
                    CleanupWarnedAt = NULL
                WHERE NextCleanupAt IS NOT NULL
                  AND NextCleanupAt >= '2026-01-01'
                  AND NextCleanupAt <  '2027-01-01';
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // החזרה למועד המקורי. מוגדר לשם שלמות בלבד — הרצתו תחזיר את
            // המחיקה של 2026, ולכן אין סיבה מעשית להריץ אותה.
            migrationBuilder.Sql(@"
                UPDATE Groups
                SET NextCleanupAt = '2026-08-30 00:00:00'
                WHERE NextCleanupAt = '2027-08-30 00:00:00';
            ");
        }
    }
}
