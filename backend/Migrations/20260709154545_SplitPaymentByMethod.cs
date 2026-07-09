using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class SplitPaymentByMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // עמודת סכום נפרדת לכל אמצעי (במקום Amount+Method יחידים)
            migrationBuilder.AddColumn<decimal>(
                name: "BitAmount", table: "Payments", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<decimal>(
                name: "PayBoxAmount", table: "Payments", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<decimal>(
                name: "CashAmount", table: "Payments", type: "TEXT", nullable: false, defaultValue: 0m);

            // שימור נתונים: הסכום הישן עובר לעמודה של האמצעי שנבחר בו
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"BitAmount\" = \"Amount\" WHERE \"Method\" = 'bit';");
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"PayBoxAmount\" = \"Amount\" WHERE \"Method\" = 'paybox';");
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"CashAmount\" = \"Amount\" WHERE \"Method\" = 'cash';");

            migrationBuilder.DropColumn(name: "Amount", table: "Payments");
            migrationBuilder.DropColumn(name: "Method", table: "Payments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount", table: "Payments", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<string>(
                name: "Method", table: "Payments", type: "TEXT", nullable: true);

            // שחזור מקורב: הסכום = סך האמצעים; האמצעי = זה שיש בו סכום חיובי
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"Amount\" = \"BitAmount\" + \"PayBoxAmount\" + \"CashAmount\";");
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"Method\" = 'cash' WHERE \"CashAmount\" > 0;");
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"Method\" = 'paybox' WHERE \"PayBoxAmount\" > 0;");
            migrationBuilder.Sql("UPDATE \"Payments\" SET \"Method\" = 'bit' WHERE \"BitAmount\" > 0;");

            migrationBuilder.DropColumn(name: "BitAmount", table: "Payments");
            migrationBuilder.DropColumn(name: "PayBoxAmount", table: "Payments");
            migrationBuilder.DropColumn(name: "CashAmount", table: "Payments");
        }
    }
}
