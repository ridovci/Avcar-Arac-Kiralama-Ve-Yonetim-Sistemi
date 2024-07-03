using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvciCarRental.DataLayer.Migrations
{
    /// <inheritdoc />
    public partial class adminActionDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AdminApprovalDate",
                table: "Rentals",
                newName: "AdminActionDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AdminActionDate",
                table: "Rentals",
                newName: "AdminApprovalDate");
        }
    }
}
