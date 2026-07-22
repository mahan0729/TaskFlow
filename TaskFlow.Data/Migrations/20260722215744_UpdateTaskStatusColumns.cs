using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTaskStatusColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Backlog'    WHERE Status = 'Todo'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Dev'        WHERE Status = 'InProgress'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Production' WHERE Status = 'Done'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Todo'       WHERE Status = 'Backlog'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'InProgress' WHERE Status = 'Dev'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Done'       WHERE Status = 'Production'");
        }
    }
}
