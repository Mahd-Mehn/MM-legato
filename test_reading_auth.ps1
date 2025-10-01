# Test script to login and access reading endpoint
$baseUrl = "http://127.0.0.1:8000"
$email = "legadax@gmail.com"
$password = "youpassword123"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"

Write-Host "=== Testing Reading Endpoint with Authentication ===" -ForegroundColor Green

# Step 1: Login to get access token
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $accessToken = $loginData.access_token
    Write-Host "✓ Login successful! Got access token." -ForegroundColor Green
    Write-Host "Token (first 20 chars): $($accessToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 2: Test the reading endpoint with auth token
Write-Host "`n2. Testing reading endpoint..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $chapterResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/reading/chapters/$chapterId" -Method GET -Headers $headers
    Write-Host "✓ Chapter endpoint successful!" -ForegroundColor Green
    Write-Host "Response status: $($chapterResponse.StatusCode)" -ForegroundColor Cyan
    
    # Parse and display chapter data
    $chapterData = $chapterResponse.Content | ConvertFrom-Json
    Write-Host "`nChapter Details:" -ForegroundColor Cyan
    Write-Host "- ID: $($chapterData.id)" -ForegroundColor White
    Write-Host "- Title: $($chapterData.title)" -ForegroundColor White
    Write-Host "- Book: $($chapterData.book_title)" -ForegroundColor White
    Write-Host "- Author: $($chapterData.book_author)" -ForegroundColor White
    Write-Host "- Chapter Number: $($chapterData.chapter_number)" -ForegroundColor White
    Write-Host "- Word Count: $($chapterData.word_count)" -ForegroundColor White
    
} catch {
    Write-Host "✗ Chapter endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details about the error
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error details: $errorContent" -ForegroundColor Red
    }
}

# Step 3: Test the debug endpoint without auth
Write-Host "`n3. Testing debug endpoint (no auth required)..." -ForegroundColor Yellow
try {
    $debugResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/reading/debug/test-chapter/$chapterId" -Method GET
    Write-Host "✓ Debug endpoint successful!" -ForegroundColor Green
    Write-Host "Debug response: $($debugResponse.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Debug endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test user info endpoint
Write-Host "`n4. Testing user info endpoint..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/me" -Method GET -Headers $headers
    $userData = $userResponse.Content | ConvertFrom-Json
    Write-Host "✓ User info successful!" -ForegroundColor Green
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "- ID: $($userData.id)" -ForegroundColor White
    Write-Host "- Email: $($userData.email)" -ForegroundColor White
    Write-Host "- Username: $($userData.username)" -ForegroundColor White
    Write-Host "- Is Writer: $($userData.is_writer)" -ForegroundColor White
} catch {
    Write-Host "✗ User info failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green