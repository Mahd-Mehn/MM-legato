# Test all reading endpoints after UUID fixes
$baseUrl = "http://127.0.0.1:8000"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"
$bookId = "dad05226-3ef2-429a-a6bc-71c98d8689c0"

Write-Host "Creating test user..." -ForegroundColor Yellow
$testEmail = "test$(Get-Random)@example.com"
$testPassword = "testpass123"

$registerBody = @{
    email = $testEmail
    username = "testuser$(Get-Random)"
    password = $testPassword
    is_writer = $false
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "User created: $($registerResponse.email)" -ForegroundColor Green
    
    # Login
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful" -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.access_token)"
    }
    
    # Test book navigation
    Write-Host "Testing book navigation..." -ForegroundColor Yellow
    try {
        $navResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/books/$bookId/navigation" -Method GET -Headers $headers
        Write-Host "Book navigation SUCCESS: $($navResponse.book_title)" -ForegroundColor Green
    } catch {
        Write-Host "Book navigation FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test bookmark creation
    Write-Host "Testing bookmark creation..." -ForegroundColor Yellow
    try {
        $bookmarkBody = @{
            chapter_id = $chapterId
            position_percentage = 25.5
        } | ConvertTo-Json
        
        $bookmarkResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/bookmarks" -Method POST -Body $bookmarkBody -ContentType "application/json" -Headers $headers
        Write-Host "Bookmark creation SUCCESS" -ForegroundColor Green
    } catch {
        Write-Host "Bookmark creation FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test reading progress
    Write-Host "Testing reading progress..." -ForegroundColor Yellow
    try {
        $progressBody = @{
            book_id = $bookId
            chapter_id = $chapterId
            position_percentage = 50.0
        } | ConvertTo-Json
        
        $progressResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/progress" -Method POST -Body $progressBody -ContentType "application/json" -Headers $headers
        Write-Host "Reading progress SUCCESS" -ForegroundColor Green
    } catch {
        Write-Host "Reading progress FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
}