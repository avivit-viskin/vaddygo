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

// CORS — בפיתוח רק localhost:3000; דומיין הייצור מוגדר ב-Cors:AllowedOrigins
// (משתני סביבה ב-Railway: Cors__AllowedOrigins__0).
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

// הקשחת ייצור (fail-closed): "*" פותח את ה-API לכל אתר באינטרנט — אסור בייצור.
// היעדר הגדרה אינו מסוכן (נשארים עם localhost בלבד = יותר מחמיר), ולכן שם רק
// מזהירים בלוג במקום להפיל שרת שכבר עובד.
if (!builder.Environment.IsDevelopment())
{
    if (allowedOrigins.Any(o => o.Trim() == "*"))
    {
        throw new InvalidOperationException(
            "Cors:AllowedOrigins אינו יכול להכיל \"*\" בייצור — יש לציין את הדומיין המדויק של הפרונט.");
    }
}

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

// הגבלת קצב על נקודות הקצה הפתוחות (ניחוש סיסמאות / הצפה)
builder.Services.AddVaddyGoRateLimiting();

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
/*
  בפיתוח אפשר להפנות מיילים לקבצים (Email:Provider=file) כדי לבדוק זרימות
  שמסתמכות על קוד שנשלח במייל. **מותנה בסביבת Development** — בייצור תמיד
  Resend, ואי אפשר לעקוף זאת דרך משתנה סביבה.
*/
if (builder.Environment.IsDevelopment()
    && string.Equals(builder.Configuration["Email:Provider"], "file",
        StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddScoped<IEmailSender, FileEmailSender>();
}
else
{
    builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>();
}
/*
  אימות דו-שלבי. הערוצים נרשמים כאוסף (IEnumerable<ITwoFactorChannel>) ולא
  כערוץ יחיד, כי בעלת המוצר ביקשה שאפשר יהיה לבחור בין מייל ל-SMS בזמן אמת:
  הקוד בוחר מתוך הזמינים במקום להיות קשור לאחד מהם.

  ספק ה-SMS נבחר לפי Sms:Provider. ברירת המחדל היא NullSmsSender — SMS עולה
  כסף ודורש חשבון, ולכן הערוץ פשוט אינו מוצע עד שיוגדרו מפתחות, במקום להיכשל
  בשליחה ברגע האמת.
*/
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<ITwoFactorChannel, EmailTwoFactorChannel>();
builder.Services.AddScoped<ITwoFactorChannel, SmsTwoFactorChannel>();
if (string.Equals(builder.Configuration["Sms:Provider"], "twilio",
        StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHttpClient();
    builder.Services.AddScoped<ISmsSender, TwilioSmsSender>();
}
else
{
    builder.Services.AddScoped<ISmsSender, NullSmsSender>();
}

builder.Services.AddScoped<IDriveFolderService, DriveFolderService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IAccountService, AccountService>();
// ייצוא המידע של המשתמשת ("זכות העיון")
builder.Services.AddScoped<IDataExportService, DataExportService>();
builder.Services.AddScoped<ITeamService, TeamService>();
// דוח מפורט לספק (טווח תאריכים, מיקום ברשימה, עריכה/מוצר אחרונים)
builder.Services.AddScoped<ISupplierReportService, SupplierReportService>();
// נתוני שימוש למנהלת VaddyGo (משפך ההרשמה בשני הצדדים)
builder.Services.AddScoped<IUsageStatsService, UsageStatsService>();
// הפעלת פרו אוטומטית מ-webhook של GROW (אחרי תשלום)
builder.Services.AddScoped<IProActivationService, ProActivationService>();
// מחסן "כוונת רכישה" ב-DB — מקשר בין לחיצת התשלום ל-webhook, ושורד אתחולי שרת
// (Scoped כי הוא ניגש ל-DbContext)
builder.Services.AddScoped<IProIntentStore, ProIntentStore>();
// תמונת המנויים (פרו של ועדים וספקים) למסך המנהלת
builder.Services.AddScoped<ISubscriptionsService, SubscriptionsService>();
// חיווי אילו הגנות פעילות בפועל (למסך המנהלת)
builder.Services.AddScoped<IEncryptionBackfillService, EncryptionBackfillService>();
builder.Services.AddScoped<ISecurityStatusService, SecurityStatusService>();
// סקרים — הוועד יוצר, ההורים עונים בקישור ציבורי
builder.Services.AddScoped<IPollService, PollService>();
// ניקוי סוף שנת לימודים — שירות + משימת רקע יומית שמריצה אותו
builder.Services.AddScoped<IYearEndCleanupService, YearEndCleanupService>();
builder.Services.AddHostedService<YearEndCleanupBackgroundService>();
builder.Services.AddScoped<IVendorProExpiryService, VendorProExpiryService>();
builder.Services.AddHostedService<VendorProExpiryBackgroundService>();
// גיבוי אוטומטי של המסד — שירות + משימת רקע (בעלייה ואז כל X שעות)
builder.Services.AddScoped<IDatabaseBackupService, SqliteBackupService>();
builder.Services.AddHostedService<DatabaseBackupBackgroundService>();

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
// רכישת מסלול פרו על ידי הספק עצמו (סליקה) — משתמש באותו IPaymentGateway
builder.Services.AddScoped<IVendorProPaymentService, VendorProPaymentService>();

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

// עוזרת ה-AI — HttpClient מוקצה (typed) לקריאות ל-Google Gemini; המפתח מ-Gemini:ApiKey
builder.Services.AddHttpClient<IAiService, AiService>();

// הצפנת שדות רגישים במנוחה — טוען את המפתח מ-Encryption:Key (ריק = כבוי)
ParentCommitteeAPI.Auth.FieldEncryption.Configure(builder.Configuration);

var app = builder.Build();

// הרצת מיגרציות בעלייה — המסד תמיד קיים ותואם למודל, גם בהתקנה נקייה.
// בנוסף: קידום מנהלת VaddyGo לתפקיד SuperAdmin לפי המייל שמוגדר ב-
// Admin:SuperAdminEmail (משתנה סביבה Admin__SuperAdminEmail), כדי שתוכל לנהל
// ספקים. אידמפוטנטי — רץ בכל עלייה ומקדם רק אם המשתמש קיים ועדיין לא SuperAdmin.
// ייצור שנשאר עם ברירת המחדל של הפיתוח (localhost בלבד) הוא בטוח, אבל הפרונט
// לא יצליח לדבר עם השרת. מזהירים בלוג כדי שהתקלה לא "תיעלם" בשקט — אין כאן
// חשיפה, ולכן מזהירים ולא מפילים שרת שכבר עובד.
if (!app.Environment.IsDevelopment() &&
    allowedOrigins.All(o => o.Contains("localhost", StringComparison.OrdinalIgnoreCase)))
{
    app.Logger.LogWarning(
        "Cors:AllowedOrigins contains only localhost — the production frontend will be blocked. " +
        "Set Cors__AllowedOrigins__0 to the frontend URL.");
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var adminEmail = (app.Configuration["Admin:SuperAdminEmail"] ?? string.Empty)
        .Trim().ToLowerInvariant();
    if (adminEmail.Length > 0)
    {
        var admin = db.Users.FirstOrDefault(u => u.Email.ToLower() == adminEmail);
        if (admin != null && admin.Role != "SuperAdmin")
        {
            admin.Role = "SuperAdmin";
            db.SaveChanges();
            // בלי הכתובת — לוגים נשמרים אצל ספק האירוח 7 ימים ואינם ניתנים
            // למחיקה לפי בקשה, ולכן אינם מקום למידע אישי. המזהה מספיק לאבחון.
            app.Logger.LogInformation("Promoted user {UserId} to SuperAdmin", admin.Id);
        }
    }
}

// כותרות אבטחה על כל תשובה — ראשון, כדי שיחולו גם על תשובות שגיאה
app.UseMiddleware<SecurityHeadersMiddleware>();

// טיפול שגיאות מרכזי — עוטף את כל הבקשות
app.UseMiddleware<ErrorHandlingMiddleware>();

// הפעל CORS
app.UseCors("AllowFrontend");

// הפניה ל-https רק בפיתוח מקומי — בענן Railway מסיים את ה-TLS בעצמו
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
