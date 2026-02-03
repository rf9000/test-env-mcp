<#
.SYNOPSIS
    Publishes an AL app to Business Central Developer Endpoint

.DESCRIPTION
    Deterministic script for publishing .app files to BC environments.
    Designed to be called from Node.js MCP server.

    URL Construction follows the knowledge base pattern:
    {scheme}://{host}/{environmentId}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}

.PARAMETER AppPath
    Full path to the .app file to publish

.PARAMETER EnvironmentId
    Environment GUID (used as BC service instance name in URL path)

.PARAMETER EnvironmentUrl
    Base URL of the BC environment (e.g., https://server.com/BC/)

.PARAMETER Username
    BC user username for Basic Authentication

.PARAMETER Password
    BC user password for Basic Authentication

.PARAMETER SchemaUpdateMode
    How to handle schema changes: synchronize (default), recreate, forcesync

.PARAMETER DependencyPublishingOption
    How to handle dependencies: default, strict, ignore

.PARAMETER Tenant
    Tenant name (default: "default")

.PARAMETER Diagnose
    If specified, outputs diagnostic information without publishing

.OUTPUTS
    JSON object with success/error information:
    {
        "success": true/false,
        "status": "completed"/"failed",
        "schemaUpdateMode": "...",
        "user": "...",
        "url": "...",
        "response": {...} or null,
        "error": "..." or null,
        "diagnostics": {...} (only in diagnose mode)
    }

.EXAMPLE
    .\Publish-BCApp.ps1 -AppPath "C:\MyApp.app" -EnvironmentId "d590df57-680e-43c0-9af0-3f97706d4663" -EnvironmentUrl "https://server/BC" -Username "user" -Password "pass"

.NOTES
    Author: Continia Environment MCP
    Version: 1.0.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path $_ -PathType Leaf })]
    [string]$AppPath,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$EnvironmentId,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$EnvironmentUrl,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Username,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Password,

    [Parameter(Mandatory = $false)]
    [ValidateSet('synchronize', 'recreate', 'forcesync')]
    [string]$SchemaUpdateMode = 'synchronize',

    [Parameter(Mandatory = $false)]
    [ValidateSet('default', 'strict', 'ignore')]
    [string]$DependencyPublishingOption = 'default',

    [Parameter(Mandatory = $false)]
    [string]$Tenant = 'default',

    [Parameter(Mandatory = $false)]
    [switch]$Diagnose,

    [Parameter(Mandatory = $false)]
    [switch]$AllowInsecureCertificates
)

# Configure error handling
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Helper function to write diagnostic messages to stderr
function Write-DiagnosticMessage {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
    [Console]::Error.WriteLine("[$timestamp] [$Level] $Message")
}

# Helper function to create JSON result
function New-PublishResult {
    param(
        [bool]$Success,
        [string]$Status,
        [string]$SchemaUpdateMode,
        [string]$User,
        [string]$Url,
        [object]$Response = $null,
        [string]$Error = $null,
        [object]$Diagnostics = $null
    )

    $result = @{
        success = $Success
        status = $Status
        schemaUpdateMode = $SchemaUpdateMode
        user = $User
        url = $Url
        response = $Response
        error = $Error
    }

    if ($Diagnostics) {
        $result.diagnostics = $Diagnostics
    }

    return $result | ConvertTo-Json -Depth 10 -Compress
}

# Helper function to redact sensitive information for logging
function Get-RedactedPassword {
    param([string]$Password)
    if ($Password.Length -le 4) {
        return '****'
    }
    return $Password.Substring(0, 2) + ('*' * ($Password.Length - 4)) + $Password.Substring($Password.Length - 2)
}

try {
    Write-DiagnosticMessage "Starting BC App Publishing"
    Write-DiagnosticMessage "App Path: $AppPath"
    Write-DiagnosticMessage "Environment ID: $EnvironmentId"
    Write-DiagnosticMessage "Environment URL: $EnvironmentUrl"
    Write-DiagnosticMessage "Username: $Username"
    Write-DiagnosticMessage "Password: $(Get-RedactedPassword $Password)"
    Write-DiagnosticMessage "Schema Update Mode: $SchemaUpdateMode"
    Write-DiagnosticMessage "Dependency Publishing Option: $DependencyPublishingOption"
    Write-DiagnosticMessage "Tenant: $Tenant"

    # Validate app file exists and get info
    $appFile = Get-Item -Path $AppPath
    Write-DiagnosticMessage "App file size: $($appFile.Length) bytes"
    Write-DiagnosticMessage "App file name: $($appFile.Name)"

    # Build the Developer Endpoint URL
    # Pattern: {scheme}://{host}/{environmentId}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}
    $baseUri = [System.Uri]$EnvironmentUrl
    $publishUrl = "$($baseUri.Scheme)://$($baseUri.Host)/$EnvironmentId/dev/apps?tenant=$Tenant&SchemaUpdateMode=$SchemaUpdateMode"

    if ($DependencyPublishingOption -and $DependencyPublishingOption -ne 'default') {
        $publishUrl += "&DependencyPublishingOption=$DependencyPublishingOption"
    }

    Write-DiagnosticMessage "Constructed URL: $publishUrl"

    # Diagnose mode - output diagnostic information without publishing
    if ($Diagnose) {
        Write-DiagnosticMessage "Running in DIAGNOSE mode - no actual publish will occur"

        $diagnostics = @{
            appPath = $AppPath
            appFileName = $appFile.Name
            appFileSize = $appFile.Length
            environmentId = $EnvironmentId
            environmentUrl = $EnvironmentUrl
            baseHost = $baseUri.Host
            baseScheme = $baseUri.Scheme
            constructedUrl = $publishUrl
            tenant = $Tenant
            schemaUpdateMode = $SchemaUpdateMode
            dependencyPublishingOption = $DependencyPublishingOption
            username = $Username
            passwordRedacted = Get-RedactedPassword $Password
            timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')
        }

        # Test connectivity
        Write-DiagnosticMessage "Testing connectivity to $($baseUri.Host)..."
        try {
            $testUri = "$($baseUri.Scheme)://$($baseUri.Host)"
            $connectivityTest = Invoke-WebRequest -Uri $testUri -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
            $diagnostics.connectivity = @{
                reachable = $true
                statusCode = $connectivityTest.StatusCode
            }
            Write-DiagnosticMessage "Host is reachable"
        }
        catch {
            $diagnostics.connectivity = @{
                reachable = $false
                error = $_.Exception.Message
            }
            Write-DiagnosticMessage "Host connectivity test failed: $($_.Exception.Message)" 'WARN'
        }

        Write-Output (New-PublishResult -Success $true -Status 'diagnosed' -SchemaUpdateMode $SchemaUpdateMode -User $Username -Url $publishUrl -Diagnostics $diagnostics)
        exit 0
    }

    # Create Basic Authentication header
    $authString = "${Username}:${Password}"
    $authBytes = [System.Text.Encoding]::UTF8.GetBytes($authString)
    $authBase64 = [System.Convert]::ToBase64String($authBytes)
    $authHeader = "Basic $authBase64"

    Write-DiagnosticMessage "Authentication header prepared"

    # Read the app file content
    Write-DiagnosticMessage "Reading app file..."
    $appContent = [System.IO.File]::ReadAllBytes($AppPath)
    Write-DiagnosticMessage "App file read successfully ($($appContent.Length) bytes)"

    # Create multipart/form-data boundary
    $boundary = [System.Guid]::NewGuid().ToString()

    # Build multipart body
    $LF = "`r`n"
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$($appFile.Name)`"",
        "Content-Type: application/octet-stream",
        "",
        ""
    )
    $bodyStart = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join $LF))
    $bodyEnd = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")

    # Combine all parts into single byte array
    $fullBody = New-Object byte[] ($bodyStart.Length + $appContent.Length + $bodyEnd.Length)
    [System.Buffer]::BlockCopy($bodyStart, 0, $fullBody, 0, $bodyStart.Length)
    [System.Buffer]::BlockCopy($appContent, 0, $fullBody, $bodyStart.Length, $appContent.Length)
    [System.Buffer]::BlockCopy($bodyEnd, 0, $fullBody, $bodyStart.Length + $appContent.Length, $bodyEnd.Length)

    Write-DiagnosticMessage "Multipart body prepared ($($fullBody.Length) bytes total)"

    # Configure TLS settings
    Write-DiagnosticMessage "Configuring TLS..."
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13

    # Handle certificate validation
    if ($AllowInsecureCertificates) {
        Write-DiagnosticMessage "WARNING: Insecure certificates allowed" 'WARN'
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    }

    # Create HTTP request
    Write-DiagnosticMessage "Creating HTTP request..."
    $httpRequest = [System.Net.HttpWebRequest]::Create($publishUrl)
    $httpRequest.Method = 'POST'
    $httpRequest.ContentType = "multipart/form-data; boundary=$boundary"
    $httpRequest.ContentLength = $fullBody.Length
    $httpRequest.Headers.Add('Authorization', $authHeader)
    $httpRequest.Headers.Add('Accept', 'application/json')
    $httpRequest.Headers.Add('X-Request-Id', [System.Guid]::NewGuid().ToString())
    $httpRequest.Timeout = 120000  # 2 minutes
    $httpRequest.ReadWriteTimeout = 120000

    Write-DiagnosticMessage "Sending request..."

    # Write request body
    $requestStream = $httpRequest.GetRequestStream()
    $requestStream.Write($fullBody, 0, $fullBody.Length)
    $requestStream.Close()

    Write-DiagnosticMessage "Request body sent, waiting for response..."

    # Get response
    try {
        $response = $httpRequest.GetResponse()
        $responseStream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        $responseStream.Close()
        $response.Close()

        Write-DiagnosticMessage "Response received: HTTP $($response.StatusCode)"
        Write-DiagnosticMessage "Response body: $responseBody"

        # Parse response if JSON
        $parsedResponse = $null
        if ($responseBody) {
            try {
                $parsedResponse = $responseBody | ConvertFrom-Json
            }
            catch {
                $parsedResponse = $responseBody
            }
        }

        Write-DiagnosticMessage "Publishing completed successfully!"
        Write-Output (New-PublishResult -Success $true -Status 'completed' -SchemaUpdateMode $SchemaUpdateMode -User $Username -Url $publishUrl -Response $parsedResponse)
    }
    catch [System.Net.WebException] {
        $webException = $_.Exception
        $statusCode = 0
        $errorBody = $null

        if ($webException.Response) {
            $errorResponse = [System.Net.HttpWebResponse]$webException.Response
            $statusCode = [int]$errorResponse.StatusCode

            $errorStream = $errorResponse.GetResponseStream()
            $errorReader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $errorReader.ReadToEnd()
            $errorReader.Close()
            $errorStream.Close()
            $errorResponse.Close()
        }

        Write-DiagnosticMessage "HTTP Error: $statusCode" 'ERROR'
        Write-DiagnosticMessage "Error body: $errorBody" 'ERROR'

        # Determine error type
        $errorMessage = switch ($statusCode) {
            401 { "Authentication failed: Invalid credentials. Username: $Username" }
            403 { "Authorization failed: User does not have permission to publish apps" }
            409 { "Schema conflict detected. Try schemaUpdateMode='forcesync' to force synchronization. Details: $errorBody" }
            default { "HTTP $statusCode error: $errorBody" }
        }

        Write-Output (New-PublishResult -Success $false -Status 'failed' -SchemaUpdateMode $SchemaUpdateMode -User $Username -Url $publishUrl -Error $errorMessage)
        exit 1
    }
}
catch {
    $errorMessage = $_.Exception.Message
    Write-DiagnosticMessage "Unexpected error: $errorMessage" 'ERROR'
    Write-DiagnosticMessage "Stack trace: $($_.ScriptStackTrace)" 'ERROR'

    # Output error result
    $result = @{
        success = $false
        status = 'failed'
        schemaUpdateMode = $SchemaUpdateMode
        user = $Username
        url = $publishUrl
        response = $null
        error = $errorMessage
    } | ConvertTo-Json -Depth 10 -Compress

    Write-Output $result
    exit 1
}
finally {
    # Reset certificate validation callback
    if ($AllowInsecureCertificates) {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $null
    }
}
