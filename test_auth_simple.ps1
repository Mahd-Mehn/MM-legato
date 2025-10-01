# Simple test script for authentication
$baseUrl = "http://127.0.0.1:8000"
$email = "legadax@gmail.com"
$password = "youpassword123"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"

Write-Host "Testing login with email: $email"

# Login request
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

Write-Host "Login body: $loginBody"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful!"
    Write-Host "Access token: $($response.access_token)"
    
    # Test reading endpoint
    $headers = @{
        "Authorization" = "Bearer $($response.access_token)"
    }
    
    Write-Host "Testing reading endpoint..."
    $chapterResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reading/chapters/$chapterId" -Method GET -Headers $headers
    Write-Host "Chapter found: $($chapterResponse.title)"
    
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Error details: $($_.ErrorDetails.Message)"
    }
}