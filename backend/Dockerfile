# Dockerfile של הבקאנד — Railway בונה לפיו את השרת (Root Directory: backend).
# שלב 1: בנייה עם ה-SDK המלא; שלב 2: הרצה עם ה-runtime הרזה בלבד.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# משחזרים חבילות קודם — שכבה שמתעדכנת רק כשה-csproj משתנה (build מהיר יותר)
COPY ParentCommitteeAPI.csproj ./
RUN dotnet restore ParentCommitteeAPI.csproj

COPY . .
RUN dotnet publish ParentCommitteeAPI.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Program.cs מאזין על PORT שמוזרק על ידי Railway (ברירת מחדל 8080)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ParentCommitteeAPI.dll"]
