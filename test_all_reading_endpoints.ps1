# Test all reading endpoints after UUID fixes
$baseUrl = "http://127.0.0.1:8000"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"
$bookId = "dad05226-3ef2-429a-a6bc-71c98d8689c0"

# Create a test user
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
    Write-Host "✓ User created: $($registerResponse.email)" -ForegroundColor Green
    
    # Login
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login successful" -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.access_token)"
    }
    
    # Test 1: Chapter reading
    Write-Host "`n1. Testing chapter reading..." -ForegroundColor Yellow
    try {
        $chapterResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/chapters/$chapterId" -Method GET -Headers $headers
        Write-Host "✓ Chapter reading successful: $($chapterResponse.title)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Chapter reading failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Book navigation
    Write-Host "`n2. Testing book navigation..." -ForegroundColor Yellow
    try {
        $navResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/books/$bookId/navigation" -Method GET -Headers $headers
        Write-Host "✓ Book navigation successful: $($navResponse.book_title)" -ForegroundColor Green
        Write-Host "  Chapters found: $($navResponse.chapters.Count)" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Book navigation failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    # Test 3: Create bookmark
    Write-Host "`n3. Testing bookmark creation..." -ForegroundColor Yellow
    try {
        $bookmarkBody = @{
            chapter_id = $chapterId
            position_percentage = 25.5
        } | ConvertTo-Json
        
        $bookmarkResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/bookmarks" -Method POST -Body $bookmarkBody -ContentType "application/json" -Headers $headers
        Write-Host "✓ Bookmark created successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Bookmark creation failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    # Test 4: Update reading progress
    Write-Host "`n4. Testing reading progress update..." -ForegroundColor Yellow
    try {
        $progressBody = @{
            book_id = $bookId
            chapter_id = $chapterId
            position_percentage = 50.0
        } | ConvertTo-Json
        
        $progressResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/progress" -Method POST -Body $progressBody -ContentType "application/json" -Headers $headers
        Write-Host "✓ Reading progress updated successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Reading progress update failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    # Test 5: Get continue reading
    Write-Host "`n5. Testing continue reading..." -ForegroundColor Yellow
    try {
        $continueResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/continue-reading" -Method GET -Headers $headers
        Write-Host "✓ Continue reading successful" -ForegroundColor Green
        Write-Host "  Books in progress: $($continueResponse.Count)" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Continue reading failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n=== All Tests Complete ===" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}