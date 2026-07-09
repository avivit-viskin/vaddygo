using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI;
using ParentCommitteeAPI.Middleware;
using ParentCommitteeAPI.Repositories;
using ParentCommitteeAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// בענן (Railway) מוזרק משתנה PORT ומאזינים עליו ב-HTTP —
// ה-TLS (https) מטופל על ידי Railway לפני שהבקשה מגיעה אלינו.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// חיבור מסד הנתונים — המחרוזת מ-appsettings.json.
// מעבר עתידי ל-SQL Server = החלפת ה-ConnectionString בלבד, בלי לגעת בקוד.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=vaadygo.db"));

// CORS — בפיתוח רק localhost:3000; דומיין הייצור יוגדר ב-Cors:AllowedOrigins (משתני סביבה ב-Railway)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();

// רישום השכבות ב-DI: ‏Repository גנרי (DAL) ו-Services (BL)
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEventService, EventService>();

var app = builder.Build();

// הרצת מיגרציות בעלייה — המסד תמיד קיים ותואם למודל, גם בהתקנה נקייה
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

// טיפול שגיאות מרכזי — עוטף את כל הבקשות, ראשון ב-pipeline
app.UseMiddleware<ErrorHandlingMiddleware>();

// הפעל CORS
app.UseCors("AllowFrontend");

// הפניה ל-https רק בפיתוח מקומי — בענן Railway מסיים את ה-TLS בעצמו
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
