# Test the fixed reading endpoint
$baseUrl = "http://127.0.0.1:8000"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"

# First test the debug endpoint to see if the fix works
Write-Host "Testing debug endpoint with fixed service..."
try {
    $debugResult = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/debug/test-chapter/$chapterId" -Method GET
    Write-Host "Debug test results:"
    $debugResult | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Debug test failed: $($_.Exception.Message)"
}

# Try to create a simple user for testing
Write-Host "`nCreating test user..."
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
    Write-Host "User created: $($registerResponse.email)"
    
    # Login with the new user
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful, got token"
    
    # Test the reading endpoint
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.access_token)"
    }
    
    Write-Host "`nTesting reading endpoint with authentication..."
    $chapterResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/chapters/$chapterId" -Method GET -Headers $headers
    Write-Host "SUCCESS! Chapter found:"
    Write-Host "- Title: $($chapterResponse.title)"
    Write-Host "- Book: $($chapterResponse.book_title)"
    Write-Host "- Author: $($chapterResponse.book_author)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}