using System.Security.Cryptography;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorService — הלוגיקה העסקית של הספקים. ניגש ל-DbContext ישירות (ולא
      דרך ה-Repository הגנרי) כי ספק נטען תמיד יחד עם המוצרים שלו (Include),
      כמו GroupService עם הקטגוריות שלו.
    */
    public class VendorService : IVendorService
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _email;
        private readonly IConfiguration _config;
        private readonly ILogger<VendorService> _logger;

        public VendorService(
            AppDbContext db,
            IEmailSender email,
            IConfiguration config,
            ILogger<VendorService> logger)
        {
            _db = db;
            _email = email;
            _config = config;
            _logger = logger;
        }

        public async Task<List<VendorResponseDto>> GetAllAsync()
        {
            var vendors = await WithChildren(_db.Vendors)
                .OrderByDescending(v => v.Featured)
                .ThenBy(v => v.Name)
                .ToListAsync();
            return vendors.Select(ToResponse).ToList();
        }

        public async Task<VendorResponseDto?> GetByIdAsync(int id)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            return vendor == null ? null : ToResponse(vendor);
        }

        public async Task<VendorResponseDto> CreateAsync(VendorCreateDto dto)
        {
            EnsureWithinLimits(dto.Products);
            var vendor = new Vendor
            {
                Name = dto.Name.Trim(),
                CatalogUrl = dto.CatalogUrl.Trim(),
                WhatsApp = dto.WhatsApp.Trim(),
                Category = dto.Category.Trim(),
                City = dto.City.Trim(),
                PaymentLink = dto.PaymentLink.Trim(),
                PaymentBit = dto.PaymentBit.Trim(),
                PaymentPaybox = (dto.PaymentPaybox ?? string.Empty).Trim(),
                PaymentBankInfo = dto.PaymentBankInfo.Trim(),
                PaymentInstallments = dto.PaymentInstallments,
                Products = MapProducts(dto.Products),
                SocialLinks = MapSocialLinks(dto.SocialLinks),
                CreatedAt = DateTime.UtcNow,
            };

            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor created (Id: {VendorId}, Products: {Count})",
                vendor.Id, vendor.Products.Count);
            return ToResponse(vendor);
        }

        public async Task<VendorResponseDto?> UpdateAsync(int id, VendorUpdateDto dto)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }

            ApplyWrite(vendor, dto);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor updated (Id: {VendorId})", id);
            return ToResponse(vendor);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return false;
            }

            _db.Vendors.Remove(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor deleted (Id: {VendorId})", id);
            return true;
        }

        public async Task<string?> GenerateEditTokenAsync(int id)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }
            // קישור בתוקף — מחזירים אותו כמו שהוא, כדי שלא ישתנה בכל בקשה.
            // קישור שפג (או שלא היה) — מייצרים חדש, וזה מבטל את הישן. כך
            // "הפקת קישור" משמשת גם כביטול קישור שהודלף.
            if (!IsTokenValid(vendor))
            {
                vendor.EditToken = Guid.NewGuid().ToString("N");
                vendor.EditTokenIssuedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _logger.LogInformation("Vendor edit link issued (Id: {VendorId})", id);
            }
            return vendor.EditToken;
        }

        public async Task<VendorResponseDto?> GetByEditTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            var vendor = await WithChildren(_db.Vendors)
                .FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return null;
            }
            var dto = ToResponse(vendor);
            // רק כאן (תצוגת הספק עצמו דרך הטוקן) חושפים את מייל ההתחברות — לא בוועד/קטלוג
            dto.LoginEmail = vendor.LoginEmail;
            // האם להציג לספק כפתור תשלום — רק כשמחוברת סליקה אמיתית
            dto.ProCheckoutAvailable = IsRealClearingConfigured();
            return dto;
        }

        public async Task<VendorResponseDto?> UpdateByEditTokenAsync(string token, VendorUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            var vendor = await WithChildren(_db.Vendors)
                .FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return null;
            }
            ApplyWrite(vendor, dto);
            vendor.LastEditedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor self-updated via edit token (Id: {VendorId})", vendor.Id);
            return ToResponse(vendor);
        }

        public async Task<CredentialResult> SetCredentialsAsync(
            string token, string loginEmail, string password)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return CredentialResult.NotFound;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return CredentialResult.NotFound;
            }
            var email = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (email.Length == 0 || PasswordPolicy.Validate(password) != null)
            {
                return CredentialResult.Invalid;
            }
            // המייל הוא מזהה ההתחברות — חייב להיות ייחודי בין הספקים
            var taken = await _db.Vendors.AnyAsync(
                v => v.Id != vendor.Id && v.LoginEmail == email);
            if (taken)
            {
                return CredentialResult.EmailTaken;
            }
            vendor.LoginEmail = email;
            vendor.PasswordHash = PasswordHasher.Hash(password);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor credentials set (Id: {VendorId})", vendor.Id);
            return CredentialResult.Ok;
        }

        public async Task<string?> LoginAsync(string loginEmail, string password)
        {
            var email = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (email.Length == 0 || string.IsNullOrEmpty(password))
            {
                return null;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.LoginEmail == email);
            if (vendor == null || string.IsNullOrEmpty(vendor.PasswordHash))
            {
                return null;
            }
            if (!PasswordHasher.Verify(password, vendor.PasswordHash))
            {
                return null;
            }
            // התחברות מוצלחת = חלון תוקף חדש לקישור. כך ספק שמשתמש במערכת
            // לעולם לא ננעל בחוץ, והתפוגה פוגעת רק בקישור נטוש או שהודלף.
            if (string.IsNullOrEmpty(vendor.EditToken))
            {
                vendor.EditToken = Guid.NewGuid().ToString("N");
            }
            vendor.EditTokenIssuedAt = DateTime.UtcNow;
            vendor.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return vendor.EditToken;
        }

        /*
          כניסת ספק עם Google — מאמת את ה-ID token מול גוגל (אותו Client ID של הוועד),
          מוצא ספק לפי מייל ההתחברות שלו (LoginEmail == המייל של חשבון הגוגל) ומחזיר את
          טוקן העריכה. אין צורך בסיסמה — גוגל כבר אימתה שהמשתמש הוא בעל המייל. מחזיר null
          אם ההזדהות נכשלה או שאין ספק עם המייל הזה (אז הלקוח מציג הודעה מתאימה).
        */
        public async Task<string?> LoginWithGoogleAsync(string credential)
        {
            if (string.IsNullOrWhiteSpace(credential))
            {
                return null;
            }
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { GoogleSettings.GetClientId(_config) },
                };
                payload = await GoogleJsonWebSignature.ValidateAsync(credential, settings);
            }
            catch (InvalidJwtException)
            {
                return null;
            }
            var email = (payload.Email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email))
            {
                return null;
            }
            // מתאימים לפי מייל ההתחברות שהספק הגדיר; ספק בלי מייל התחברות לא ניתן לכניסה
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.LoginEmail == email);
            if (vendor == null)
            {
                return null;
            }
            if (string.IsNullOrEmpty(vendor.EditToken))
            {
                vendor.EditToken = Guid.NewGuid().ToString("N");
            }
            // כמו בהתחברות רגילה — חלון תוקף חדש לקישור
            vendor.EditTokenIssuedAt = DateTime.UtcNow;
            vendor.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor logged in with Google (Id: {VendorId})", vendor.Id);
            return vendor.EditToken;
        }

        public async Task<(string? Token, string? Error)> RegisterAsync(
            string name, string loginEmail, string password)
        {
            var vendorName = (name ?? string.Empty).Trim();
            var email = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (vendorName.Length == 0)
            {
                return (null, "צריך שם עסק/ספק");
            }
            if (email.Length == 0 || !email.Contains('@'))
            {
                return (null, "צריך כתובת מייל תקינה");
            }
            // אותו כלל סיסמה כמו לוועד — אחרת צד הספקים היה דלת אחורית לסיסמה חלשה
            var weakReg = PasswordPolicy.Validate(password);
            if (weakReg != null)
            {
                return (null, weakReg);
            }
            // המייל הוא מזהה ההתחברות — חייב להיות ייחודי בין הספקים
            var taken = await _db.Vendors.AnyAsync(v => v.LoginEmail == email);
            if (taken)
            {
                return (null, "כתובת המייל כבר רשומה. אפשר להתחבר או לאפס סיסמה.");
            }

            var vendor = new Vendor
            {
                Name = vendorName,
                LoginEmail = email,
                PasswordHash = PasswordHasher.Hash(password),
                EditToken = Guid.NewGuid().ToString("N"),
                EditTokenIssuedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor self-registered (Id: {VendorId})", vendor.Id);

            // מודיעים לבעלת VaddyGo שנרשם ספק חדש (Resend שולח לכתובת הבעלים)
            await NotifyOwnerAsync(
                "ספק חדש נרשם ל-VaddyGo 🎉",
                "שלום 🙂\n\n" +
                "נרשם עסק/ספק חדש לפורטל הספקים של VaddyGo:\n\n" +
                $"שם העסק: {vendor.Name}\n" +
                $"מייל להתחברות: {vendor.LoginEmail}\n\n" +
                "צוות VaddyGo 💜");

            return (vendor.EditToken, null);
        }

        // מודיע לבעלת VaddyGo (SuperAdmin) על אירוע — Resend שולח לכתובת הבעלים.
        // כישלון שליחה לא מפיל את ההרשמה (עטוף ב-try/catch ונרשם ללוג).
        private async Task NotifyOwnerAsync(string subject, string body)
        {
            var adminEmail = (_config["Admin:SuperAdminEmail"] ?? string.Empty).Trim();
            if (adminEmail.Length == 0)
            {
                return;
            }
            try
            {
                await _email.SendAsync(adminEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send owner new-signup email");
            }
        }

        public async Task RequestPasswordResetAsync(string email)
        {
            var normalized = (email ?? string.Empty).Trim().ToLowerInvariant();
            if (normalized.Length == 0)
            {
                return; // לא חושפים דבר — "מצליח" בשקט
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.LoginEmail == normalized);
            // מייל לא רשום, או ספק שלא הגדיר סיסמה — לא חושפים (מונע enumeration)
            if (vendor == null || string.IsNullOrEmpty(vendor.PasswordHash))
            {
                return;
            }

            // קוד בן 6 ספרות (קריפטוגרפי). נשמר מגובב בלבד; תקף ל-5 דקות.
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            vendor.ResetCodeHash = PasswordHasher.Hash(code);
            vendor.ResetCodeExpiresAt = DateTime.UtcNow.AddMinutes(5);
            vendor.ResetCodeAttempts = 0; // קוד חדש — מאתחלים את מונה הניסיונות
            await _db.SaveChangesAsync();

            var body =
                "שלום 🙂\n\n" +
                $"הקוד שלך לאיפוס סיסמת הספק ב-VaddyGo הוא: {code}\n\n" +
                "הקוד תקף ל-5 דקות. אם לא ביקשת לאפס סיסמה — אפשר פשוט להתעלם מהמייל הזה.\n\n" +
                "בהצלחה,\nצוות VaddyGo 💜";
            try
            {
                await _email.SendAsync(vendor.LoginEmail, "קוד לאיפוס סיסמת ספק — VaddyGo", body);
                _logger.LogInformation("Vendor password reset code issued (Id: {VendorId})", vendor.Id);
            }
            catch (Exception ex)
            {
                // כשל שליחה לא נחשף לספק (עדיין מחזירים הצלחה כללית) — רק נרשם ללוג.
                _logger.LogError(ex, "Failed to send vendor reset email (Id: {VendorId})", vendor.Id);
            }
        }

        public async Task<string?> ResetPasswordAsync(string loginEmail, string code, string newPassword)
        {
            const string genericError = "הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.";
            var normalized = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.LoginEmail == normalized);

            // אין תהליך איפוס פעיל / פג תוקף — כשל אחיד (לא חושפים פרטים)
            if (vendor == null
                || string.IsNullOrEmpty(vendor.ResetCodeHash)
                || vendor.ResetCodeExpiresAt == null
                || vendor.ResetCodeExpiresAt.Value < DateTime.UtcNow)
            {
                return genericError;
            }

            // קוד שגוי — סופרים ניסיון; אחרי 5 שגויים מבטלים את הקוד (מונע ניחוש גס)
            if (!PasswordHasher.Verify((code ?? string.Empty).Trim(), vendor.ResetCodeHash))
            {
                vendor.ResetCodeAttempts += 1;
                if (vendor.ResetCodeAttempts >= 5)
                {
                    vendor.ResetCodeHash = null;
                    vendor.ResetCodeExpiresAt = null;
                    vendor.ResetCodeAttempts = 0;
                    _logger.LogWarning(
                        "Vendor reset code invalidated after too many attempts (Id: {VendorId})", vendor.Id);
                }
                await _db.SaveChangesAsync();
                return genericError;
            }

            var weakReset = PasswordPolicy.Validate(newPassword);
            if (weakReset != null)
            {
                return weakReset;
            }

            // קוד תקין — מאפסים סיסמה ומנקים את מצב האיפוס
            vendor.PasswordHash = PasswordHasher.Hash(newPassword);
            vendor.ResetCodeHash = null;      // קוד חד-פעמי — נמחק אחרי שימוש
            vendor.ResetCodeExpiresAt = null;
            vendor.ResetCodeAttempts = 0;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor password reset via code (Id: {VendorId})", vendor.Id);
            return null;
        }

        public async Task<bool> ChangePasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token) || PasswordPolicy.Validate(newPassword) != null)
            {
                return false;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return false;
            }
            vendor.PasswordHash = PasswordHasher.Hash(newPassword);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor password changed via token (Id: {VendorId})", vendor.Id);
            return true;
        }

        public async Task<bool> RequestDeletionAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return false;
            }
            // רק אם עוד לא ביקש — רושמים ומודיעים למנהלת (מונע ספאם על לחיצות חוזרות)
            if (vendor.DeletionRequestedAt == null)
            {
                vendor.DeletionRequestedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _logger.LogInformation("Vendor requested deletion (Id: {VendorId})", vendor.Id);

                // מייל למנהלת VaddyGo (Resend עובד לכתובת הבעלים) — שתדע גם אם
                // הודעת הוואטסאפ מהספק לא נשלחה בפועל.
                var adminEmail = (_config["Admin:SuperAdminEmail"] ?? string.Empty).Trim();
                if (adminEmail.Length > 0)
                {
                    var body =
                        "שלום 🙂\n\n" +
                        $"הספק \"{vendor.Name}\" ביקש למחוק את חשבונו ב-VaddyGo.\n" +
                        "אפשר לאשר או לדחות את הבקשה במסך הספקים באפליקציה.\n\n" +
                        "צוות VaddyGo 💜";
                    try
                    {
                        await _email.SendAsync(
                            adminEmail, "בקשת מחיקת חשבון ספק — VaddyGo", body);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send deletion-request email");
                    }
                }
            }
            return true;
        }

        public async Task<bool> DismissDeletionAsync(int id)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return false;
            }
            vendor.DeletionRequestedAt = null;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor deletion request dismissed (Id: {VendorId})", id);
            return true;
        }

        public async Task<VendorResponseDto?> GetPublicCatalogAsync(int id)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }
            // כל פתיחה של הקטלוג הציבורי סופרת צפייה (לדאשבורד הספק)
            vendor.Views += 1;
            await _db.SaveChangesAsync();
            var dto = ToResponse(vendor);
            // בקטלוג הציבורי לא חושפים פרטי תשלום פרטיים
            dto.PaymentLink = string.Empty;
            dto.PaymentBit = string.Empty;
            dto.PaymentPaybox = string.Empty;
            dto.PaymentBankInfo = string.Empty;
            dto.PaymentInstallments = 0;
            return dto;
        }

        /* מונה פניות — ועד לחץ "בקשת הצעת מחיר". מגדיל את Leads (לדאשבורד הספק). */
        public async Task<bool> RecordLeadAsync(int id)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return false;
            }
            vendor.Leads += 1;
            await _db.SaveChangesAsync();
            return true;
        }

        /* שומר בקשת הצעת מחיר מלאה (RFQ) לתיבת הספק, ומגדיל את מונה הפניות. */
        public async Task<bool> CreateLeadAsync(int vendorId, int? groupId, LeadCreateDto dto)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == vendorId);
            if (vendor == null)
            {
                return false;
            }
            _db.Leads.Add(new Lead
            {
                VendorId = vendorId,
                GroupId = groupId,
                CommitteeName = (dto.CommitteeName ?? string.Empty).Trim(),
                Subject = (dto.Subject ?? string.Empty).Trim(),
                Quantity = dto.Quantity,
                EventDate = dto.EventDate,
                Budget = dto.Budget,
                Message = (dto.Message ?? string.Empty).Trim(),
                ContactName = (dto.ContactName ?? string.Empty).Trim(),
                ContactPhone = (dto.ContactPhone ?? string.Empty).Trim(),
                Status = "new",
                CreatedAt = DateTime.UtcNow,
            });
            vendor.Leads += 1;
            await _db.SaveChangesAsync();
            return true;
        }

        /* פניות הספק לפי טוקן העריכה (חדשות למעלה). null אם הטוקן לא נמצא. */
        public async Task<IReadOnlyList<LeadResponseDto>?> GetLeadsByEditTokenAsync(string token)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return null;
            }
            var leads = await _db.Leads
                .Where(l => l.VendorId == vendor.Id)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
            return leads.Select(ToLeadResponse).ToList();
        }

        /* עדכון סטטוס פנייה — רק אם הפנייה שייכת לספק של הטוקן וסטטוס חוקי. */
        public async Task<bool> UpdateLeadStatusAsync(string token, int leadId, string status)
        {
            var allowed = new[] { "new", "quoted", "won", "closed" };
            if (!allowed.Contains(status))
            {
                return false;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (!IsTokenValid(vendor)) { vendor = null; }
            if (vendor == null)
            {
                return false;
            }
            var lead = await _db.Leads
                .FirstOrDefaultAsync(l => l.Id == leadId && l.VendorId == vendor.Id);
            if (lead == null)
            {
                return false;
            }
            lead.Status = status;
            await _db.SaveChangesAsync();
            return true;
        }

        private static LeadResponseDto ToLeadResponse(Lead l) => new()
        {
            Id = l.Id,
            CommitteeName = l.CommitteeName,
            Subject = l.Subject,
            Quantity = l.Quantity,
            EventDate = l.EventDate,
            Budget = l.Budget,
            Message = l.Message,
            ContactName = l.ContactName,
            ContactPhone = l.ContactPhone,
            Status = l.Status,
            CreatedAt = l.CreatedAt,
        };

        /* מנהלת מסמנת/מבטלת "ספק מומלץ" (תג ומיקום עליון). */
        public async Task<VendorResponseDto?> SetFeaturedAsync(int id, bool featured)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }
            vendor.Featured = featured;
            await _db.SaveChangesAsync();
            return ToResponse(vendor);
        }

        /* מנהלת פותחת/סוגרת מסלול פרו לספק (פותח את פיצ'רי הפרו של הספק). */
        public async Task<VendorResponseDto?> SetProAsync(int id, bool isPro)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }
            vendor.IsPro = isPro;
            await _db.SaveChangesAsync();
            return ToResponse(vendor);
        }

        public async Task<List<VendorDirectoryDto>> GetDirectoryAsync()
        {
            return await _db.Vendors
                .OrderByDescending(v => v.Featured)
                .ThenBy(v => v.Name)
                .Select(v => new VendorDirectoryDto
                {
                    Id = v.Id,
                    Name = v.Name,
                    Category = v.Category,
                    City = v.City,
                    ProductCount = v.Products.Count,
                    WhatsApp = v.WhatsApp,
                    Featured = v.Featured,
                    IsKosher = v.IsKosher,
                })
                .ToListAsync();
        }

        /* החלת שדות הכתיבה על ספק — משותף לעריכת המנהל ולעריכה העצמית בטוקן.
           רשימות הבנים (מוצרים/רשתות) מוחלפות כולן — פשוט ותואם לטופס. */
        private void ApplyWrite(Vendor vendor, VendorWriteDto dto)
        {
            EnsureWithinLimits(dto.Products);
            vendor.Name = dto.Name.Trim();
            vendor.CatalogUrl = dto.CatalogUrl.Trim();
            vendor.WhatsApp = dto.WhatsApp.Trim();
            // מבצע: null = לא נשלח (שמירה חלקית) → משאירים את הקיים, לא מוחקים.
            if (dto.Offer != null) vendor.Offer = dto.Offer.Trim();
            vendor.Category = dto.Category.Trim();
            vendor.City = dto.City.Trim();
            vendor.IsKosher = dto.IsKosher;
            vendor.PaymentLink = dto.PaymentLink.Trim();
            vendor.PaymentBit = dto.PaymentBit.Trim();
            // פייבוקס: null = השדה לא נשלח (שמירה כללית) → משאירים כמו שהוא, לא מוחקים.
            if (dto.PaymentPaybox != null) vendor.PaymentPaybox = dto.PaymentPaybox.Trim();
            vendor.PaymentBankInfo = dto.PaymentBankInfo.Trim();
            vendor.PaymentInstallments = dto.PaymentInstallments;
            _db.VendorProducts.RemoveRange(vendor.Products);
            _db.VendorSocialLinks.RemoveRange(vendor.SocialLinks);
            vendor.Products = MapProducts(dto.Products);
            vendor.SocialLinks = MapSocialLinks(dto.SocialLinks);
        }

        /*
          האם קישור העריכה של הספק עדיין בתוקף. כל אחזור לפי טוקן עובר כאן —
          כך אין מסלול שנשכח ונשאר פתוח לנצח (ראו VendorTokenPolicy).
        */
        /*
          תקרת גודל לכרטיס — נבדקת בכל מסלול שמירה (יצירה ע"י המנהלת, עריכה
          ע"י המנהלת, ועריכה עצמית של הספק). נזרקת חריגה במקום להחזיר null,
          כדי שההודעה תגיע למשתמש כפי שהיא ולא תיראה כמו "ספק לא נמצא".
        */
        private void EnsureWithinLimits(List<VendorProductDto>? products)
        {
            var error = VendorLimits.Validate(
                products,
                _config.GetValue("Vendors:MaxProducts", VendorLimits.DefaultMaxProducts),
                _config.GetValue("Vendors:MaxImageBytes", VendorLimits.DefaultMaxImageBytes));
            if (error != null)
            {
                throw new PayloadTooLargeException(error);
            }
        }

        private bool IsTokenValid(Vendor? vendor) =>
            VendorTokenPolicy.IsValid(
                vendor,
                _config.GetValue("Vendors:EditTokenDays", VendorTokenPolicy.DefaultDays));

        /*
          האם מחוברת סליקה אמיתית. ‏"mock" הוא סימולטור הפיתוח — עם ספק מדומה
          אסור להציע לספק אמיתי "תשלום מאובטח", כי הוא יגיע לעמוד שאינו מחייב.
        */
        private bool IsRealClearingConfigured()
        {
            var provider = _config["Payments:Provider"] ?? "mock";
            return !string.Equals(provider, "mock", StringComparison.OrdinalIgnoreCase);
        }

        /* ספק נטען תמיד עם המוצרים והקישורים החברתיים שלו */
        private static IQueryable<Vendor> WithChildren(IQueryable<Vendor> query) =>
            query.Include(v => v.Products).Include(v => v.SocialLinks);

        /*
          שם המוצר אינו חובה (החלטת בעלת המוצר, 08.08.2026) — ספק שמצלם מוצרים
          בטלפון שומר קודם ונותן שמות אחר כך, ובממשק המוצר מוצג כ"מוצר N".
          לכן **לא** מסננים לפי שם; מסננים רק שורה **ריקה לגמרי** (בלי שם, תיאור,
          מחיר, תמונה ותיקייה) — כזו נוצרת מלחיצה על "הוספת מוצר" בלי מילוי,
          ואין טעם לשמור אותה.
        */
        private static bool HasContent(VendorProductDto p) =>
            !string.IsNullOrWhiteSpace(p.Name)
            || !string.IsNullOrWhiteSpace(p.Description)
            || p.Price > 0
            || !string.IsNullOrWhiteSpace(p.ImageUrl)
            || !string.IsNullOrWhiteSpace(p.Folder);

        private static List<VendorProduct> MapProducts(List<VendorProductDto> products) =>
            products
                .Where(HasContent)
                .Select(p => new VendorProduct
                {
                    Name = (p.Name ?? string.Empty).Trim(),
                    Description = (p.Description ?? string.Empty).Trim(),
                    Price = p.Price,
                    ImageUrl = p.ImageUrl.Trim(),
                    Folder = (p.Folder ?? string.Empty).Trim(),
                    Unit = (p.Unit ?? string.Empty).Trim(),
                })
                .ToList();

        private static List<VendorSocialLink> MapSocialLinks(List<VendorSocialLinkDto> links) =>
            links
                .Where(l => !string.IsNullOrWhiteSpace(l.Url))
                .Select(l => new VendorSocialLink
                {
                    Label = l.Label.Trim(),
                    Url = l.Url.Trim(),
                })
                .ToList();

        private static VendorResponseDto ToResponse(Vendor vendor) => new()
        {
            Id = vendor.Id,
            Name = vendor.Name,
            CatalogUrl = vendor.CatalogUrl,
            WhatsApp = vendor.WhatsApp,
            Category = vendor.Category,
            City = vendor.City,
            PaymentLink = vendor.PaymentLink,
            PaymentBit = vendor.PaymentBit,
            PaymentPaybox = vendor.PaymentPaybox,
            PaymentBankInfo = vendor.PaymentBankInfo,
            PaymentInstallments = vendor.PaymentInstallments,
            HasLogin = !string.IsNullOrEmpty(vendor.LoginEmail),
            DeletionRequested = vendor.DeletionRequestedAt != null,
            Views = vendor.Views,
            Leads = vendor.Leads,
            LastLoginAt = vendor.LastLoginAt,
            LastEditedAt = vendor.LastEditedAt,
            Offer = vendor.Offer,
            Featured = vendor.Featured,
            IsPro = vendor.IsPro,
            IsKosher = vendor.IsKosher,
            Products = vendor.Products.Select(p => new VendorProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                Folder = p.Folder,
                Unit = p.Unit,
            }).ToList(),
            SocialLinks = vendor.SocialLinks.Select(l => new VendorSocialLinkResponseDto
            {
                Id = l.Id,
                Label = l.Label,
                Url = l.Url,
            }).ToList(),
        };
    }
}
