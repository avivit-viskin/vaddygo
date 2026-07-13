using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class RestoreAvivitGroupOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            /*
              תיקון-נתונים חד-פעמי: החזרת הבעלות של בעלת המוצר על הגן שלה.
              תיקון האבטחה (AddGroupOwner) שִייך את כל הגנים הישנים ל-MIN(Users.Id),
              שאינו החשבון הפעיל שלה — ולכן כל הנתונים שלה "נעלמו" מהתצוגה.
              כאן משייכים את הגנים שמכילים את הנתונים האמיתיים שלה (תלמידים/צוות)
              לחשבון שלה (לפי מייל), למעט חשבונות-בדיקה זמניים. בלי שינוי סכימה.
              המשמר (EXISTS) מבטיח שהעדכון רץ רק אם המשתמשת קיימת — כדי לא לאפס
              בעלות ל-NULL אם המייל לא נמצא.
            */
            // תחום מדויק: רק גנים שהמיגרציה AddGroupOwner שייכה ל-MIN(Users.Id)
            // (בעל-בטעות) *ושמכילים נתונים אמיתיים* (תלמידים/צוות). זהו בדיוק
            // ה"ביטול" של השיוך השגוי עבור הנתונים שלה — לא נוגע בגן של אף
            // משתמש אחר. רץ רק אם החשבון שלה קיים ואינו אותו MIN.
            migrationBuilder.Sql(@"
                UPDATE Groups
                SET UserId = (SELECT Id FROM Users WHERE Email = 'avivitm91@gmail.com' ORDER BY Id LIMIT 1)
                WHERE EXISTS (SELECT 1 FROM Users WHERE Email = 'avivitm91@gmail.com')
                  AND UserId = (SELECT MIN(Id) FROM Users)
                  AND (SELECT MIN(Id) FROM Users) <> (SELECT Id FROM Users WHERE Email = 'avivitm91@gmail.com' ORDER BY Id LIMIT 1)
                  AND (
                        Id IN (SELECT DISTINCT GroupId FROM Students WHERE GroupId IS NOT NULL)
                     OR Id IN (SELECT DISTINCT GroupId FROM StaffMembers WHERE GroupId IS NOT NULL)
                  );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // תיקון-נתונים חד-כיווני — אין ביטול (לא נשמר הבעלים הקודם)
        }
    }
}
