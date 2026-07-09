using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParentCommitteeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftsAndVendors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Vendors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CatalogUrl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vendors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    HolidayKey = table.Column<string>(type: "TEXT", nullable: true),
                    HolidayName = table.Column<string>(type: "TEXT", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    VendorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Gifts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "VendorProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: false),
                    VendorId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorProducts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Gifts_VendorId",
                table: "Gifts",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorProducts_VendorId",
                table: "VendorProducts",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Gifts");

            migrationBuilder.DropTable(
                name: "VendorProducts");

            migrationBuilder.DropTable(
                name: "Vendors");
        }
    }
}
