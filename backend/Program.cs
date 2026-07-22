using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
// בקרת גישה לפי המשתמש המחובר (בעלות) — נדרש גישה ל-HttpContext כדי לקרוא את ה-JWT
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAccessScope, AccessScope>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IGiftService, GiftService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
// שליחת מייל (קוד איפוס סיסמה) דרך ה-HTTP API של Resend (HTTPS — Railway חוסמת SMTP).
// הגדרות ב-Resend:ApiKey (ו-Resend:Sender אופציונלי). typed HttpClient כמו ל-AI.
builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>();
builder.Services.AddScoped<IDriveFolderService, DriveFolderService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITeamService, TeamService>();

// סליקת אשראי — ספק לפי Payments:Provider. mock=סימולטור לפיתוח/בדיקות, payplus=פרודקשן.
var paymentProvider = builder.Configuration["Payments:Provider"] ?? "mock";
if (string.Equals(paymentProvider, "payplus", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHttpClient<IPaymentGateway, PayPlusGateway>();
}
else
{
    builder.Services.AddScoped<IPaymentGateway, MockPaymentGateway>();
}
builder.Services.AddScoped<ICardPaymentService, CardPaymentService>();

// אבטחה (fail-closed): בייצור חובה מפתח JWT אמיתי. אם חסר, או שהוא מפתח-הפיתוח
// הציבורי — השרת לא יעלה, כדי שלא נרוץ בטעות עם מפתח שאפשר לזייף איתו טוקנים.
if (!builder.Environment.IsDevelopment())
{
    var configuredJwtKey = builder.Configuration["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(configuredJwtKey) || configuredJwtKey == JwtSettings.DevKey)
    {
        throw new InvalidOperationException(
            "Jwt:Key חייב להיות מוגדר בייצור (משתנה סביבה Jwt__Key) כמפתח סודי חזק — " +
            "מפתח הפיתוח הציבורי אסור בשימוש.");
    }
}

// אימות JWT — בודק את ה-token שהלקוח שולח בכותרת Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,       // token שפג (כשהמנוי פג) נדחה אוטומטית
            ValidateIssuerSigningKey = true,
            ValidIssuer = JwtSettings.Issuer,
            ValidAudience = JwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(JwtSettings.GetKey(builder.Configuration))),
        };
    });

// ברירת מחדל: כל endpoint דורש משתמש מזוהה. פתיחת חריגים דרך [AllowAnonymous]
// (מסך ההרשמה/כניסה). כך "כל endpoint מוגן" בלי לגעת בכל קונטרולר בנפרד.
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// עוזרת ה-AI — HttpClient מוקצה (typed) לקריאות ל-Anthropic; המפתח מ-Anthropic:ApiKey
builder.Services.AddHttpClient<IAiService, AiService>();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
