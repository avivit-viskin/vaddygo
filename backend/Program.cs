using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI;
var builder = WebApplication.CreateBuilder(args);
// חיבור מסד הנתונים
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=vaadygo.db"));
// הוסף CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi


var app = builder.Build();
// הפעל CORS
app.UseCors("AllowFrontend");
// Configure the HTTP request pipeline.


app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
