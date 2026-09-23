using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /*
      מזעור נתונים אחרי בדיקת הפרטיות (23.09.2026) — שלושה שינויים על התלמיד:

      1. **כתובת הילד** נמחקת. נבדק בקוד: היא נאספה, הוצפנה ונשמרה — ומעולם
         לא הוצגה, לא יוצאה ולא שימשה בשום תהליך. כלומר נאספה בלי צורך תפעולי.
      2. **"האם ההורים נשואים"** נמחק. נתון על מצב משפחתי, בלי שום שימוש.
      3. **שנת הלידה** נמחקת מהרשומות הקיימות. היום והחודש נשמרים (ברכת יום
         הולדת), והשנה — הנתון שהופך תאריך לידה למזהה אישי — לא.

      ⚠️ זו מחיקה בלתי הפיכה של נתונים קיימים. זו הכוונה: מזעור נתונים שלא
      מוחק את מה שכבר נאסף אינו מזעור.
    */
    /// <inheritdoc />
    public partial class RemoveStudentPrivacyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ParentsMarried",
                table: "Students");

            // מחיקת שנת הלידה מהרשומות הקיימות: משאירים MM-DD ומחליפים את השנה
            // בשנת-הדמה. DateOnly נשמר ב-SQLite כטקסט yyyy-MM-dd.
            migrationBuilder.Sql(
                "UPDATE Students SET BirthDate = '2000-' || substr(BirthDate, 6) " +
                "WHERE BirthDate IS NOT NULL AND length(BirthDate) >= 10 " +
                "  AND substr(BirthDate, 1, 4) <> '2000';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Students",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ParentsMarried",
                table: "Students",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
