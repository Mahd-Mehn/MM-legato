# Create test user script
$baseUrl = "http://127.0.0.1:8000"
$email = "legadax@gmail.com"
$password = "youpassword123"
$username = "testuser"

Write-Host "Creating test user..."

$registerBody = @{
    email = $email
    username = $username
    password = $password
    is_writer = $true
} | ConvertTo-Json

Write-Host "Registration body: $registerBody"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "User created successfully!"
    Write-Host "User ID: $($response.id)"
    Write-Host "Email: $($response.email)"
    Write-Host "Username: $($response.username)"
    
} catch {
    Write-Host "Registration error:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Error details: $($_.ErrorDetails.Message)"
    }
}

# Now try to login
Write-Host "`nTrying to login..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful!"
    Write-Host "Access token received: $($loginResponse.access_token.Substring(0,20))..."
    
} catch {
    Write-Host "Login error:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Error details: $($_.ErrorDetails.Message)"
    }
}