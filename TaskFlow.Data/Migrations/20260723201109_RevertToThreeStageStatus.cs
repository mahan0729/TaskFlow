using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Data.Migrations
{
    /// <inheritdoc />
    public partial class RevertToThreeStageStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Collapse 8-stage statuses back to 3-stage
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Todo'       WHERE Status IN ('Backlog', 'Grooming', 'Ready')");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'InProgress' WHERE Status IN ('Dev', 'QA', 'Demo', 'UAT')");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Done'       WHERE Status = 'Production'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore 8-stage statuses (best-effort — maps to closest equivalent)
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Backlog'    WHERE Status = 'Todo'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Dev'        WHERE Status = 'InProgress'");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Production' WHERE Status = 'Done'");
        }
    }
}
