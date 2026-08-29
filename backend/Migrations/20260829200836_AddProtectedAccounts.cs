using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /*
      חשבון מוגן — דגל שמחריג חשבון מכל מחיקה אוטומטית או מרוכזת.

      נדרש אחרי שחשבון בוט-הבדיקות (QA) נמחק בטעות ע"י סריקת הניקוי של דומיינים
      שמורים, ובדיקות ה-E2E מול האתר החי נכשלו שבעה ימים ברצף בלי שאיש ידע.

      המיגרציה גם מדליקה את הדגל לחשבון הבוט הקיים, כדי שההגנה תתפוס מיד בפריסה
      הבאה ולא רק על חשבונות שייווצרו מכאן והלאה.
    */
    /// <inheritdoc />
    public partial class AddProtectedAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsProtected",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            // הדלקת הדגל לחשבון בוט-הבדיקות הקיים. אידמפוטנטי, ולא עושה כלום
            // במסד שאין בו את החשבון (סביבת פיתוח / מסד נקי).
            migrationBuilder.Sql(
                "UPDATE Users SET IsProtected = 1 " +
                "WHERE lower(Email) = 'avivitm91+qabot@gmail.com';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsProtected",
                table: "Users");
        }
    }
}
