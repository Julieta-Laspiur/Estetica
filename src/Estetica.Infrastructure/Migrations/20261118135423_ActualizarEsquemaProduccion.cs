using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Estetica.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarEsquemaProduccion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Servicios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParaQueSirve",
                table: "Servicios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Productos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParaQueSirve",
                table: "Productos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Servicios");

            migrationBuilder.DropColumn(
                name: "ParaQueSirve",
                table: "Servicios");

            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "ParaQueSirve",
                table: "Productos");
        }
    }
}
