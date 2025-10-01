# Test comments endpoint after UUID fixes
$baseUrl = "http://127.0.0.1:8000"
$chapterId = "4423cc95-c6c2-49b0-967d-998cca4c6bc9"

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
    
    # Test comment creation
    Write-Host "Testing comment creation..." -ForegroundColor Yellow
    try {
        $commentBody = @{
            chapter_id = $chapterId
            content = "This is a test comment from PowerShell!"
            parent_id = $null
        } | ConvertTo-Json
        
        $commentResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/comments/" -Method POST -Body $commentBody -ContentType "application/json" -Headers $headers
        Write-Host "Comment creation SUCCESS!" -ForegroundColor Green
        Write-Host "Comment ID: $($commentResponse.id)" -ForegroundColor Cyan
        Write-Host "Content: $($commentResponse.content)" -ForegroundColor Cyan
        
        $createdCommentId = $commentResponse.id
        
        # Test getting chapter comments
        Write-Host "Testing get chapter comments..." -ForegroundColor Yellow
        try {
            $commentsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/comments/chapter/$chapterId" -Method GET -Headers $headers
            Write-Host "Get comments SUCCESS! Found $($commentsResponse.Count) comments" -ForegroundColor Green
        } catch {
            Write-Host "Get comments FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test comment like
        Write-Host "Testing comment like..." -ForegroundColor Yellow
        try {
            $likeResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/comments/$createdCommentId/like" -Method POST -Headers $headers
            Write-Host "Comment like SUCCESS! Liked: $($likeResponse.is_liked)" -ForegroundColor Green
        } catch {
            Write-Host "Comment like FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "Comment creation FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
}