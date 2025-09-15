import json
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jinja2 import Template
try:
    import qrcode
    import io
    QR_CODE_AVAILABLE = True
except ImportError:
    QR_CODE_AVAILABLE = False
import os
from crypto_service import CryptographicProtectionService

class CertificateOfAuthorshipService:
    """Service for generating and managing Certificates of Authorship"""
    
    def __init__(self):
        self.crypto_service = CryptographicProtectionService()
        self.platform_name = "Legato Platform"
        self.platform_url = os.getenv("PLATFORM_URL", "https://legato.app")
    
    def generate_certificate(self, registration_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a Certificate of Authorship"""
        
        # Generate unique certificate number
        certificate_number = self.crypto_service.generate_certificate_number()
        
        # Create certificate data
        certificate_data = {
            "certificate_number": certificate_number,
            "platform": self.platform_name,
            "platform_url": self.platform_url,
            "issued_at": datetime.utcnow().isoformat(),
            "expires_at": None,  # Certificates don't expire by default
            
            # Content information
            "content": {
                "id": registration_data["content_id"],
                "title": registration_data["title"],
                "type": registration_data["content_type"],
                "hash": registration_data["content_hash"],
                "hash_algorithm": "SHA-256"
            },
            
            # Author information
            "author": {
                "id": registration_data["author_id"],
                "name": registration_data.get("author_name", "Author"),
            },
            
            # Registration details
            "registration": {
                "id": registration_data["registration_id"],
                "timestamp": registration_data["timestamp"],
                "timestamp_authority": registration_data.get("timestamp_authority"),
                "verification_method": registration_data.get("verification_method", "sha256_timestamp")
            },
            
            # Legal statement
            "legal_statement": self._generate_legal_statement(),
            
            # Verification information
            "verification": {
                "url": f"{self.platform_url}/verify/{certificate_number}",
                "qr_code_data": f"{self.platform_url}/verify/{certificate_number}"
            }
        }
        
        # Create digital signature
        digital_signature = self.crypto_service.create_digital_signature(certificate_data)
        
        # Generate QR code for verification
        qr_code_data = self._generate_qr_code(certificate_data["verification"]["url"])
        
        return {
            "certificate_number": certificate_number,
            "certificate_data": certificate_data,
            "digital_signature": digital_signature,
            "qr_code_data": qr_code_data,
            "issued_at": datetime.utcnow(),
            "status": "active"
        }
    
    def _generate_legal_statement(self) -> str:
        """Generate legal statement for the certificate"""
        return """
This Certificate of Authorship serves as cryptographic proof that the above-named author 
created the specified content at the timestamp indicated. The content has been digitally 
fingerprinted using SHA-256 cryptographic hashing and timestamped by a trusted authority.

This certificate may be used as evidence of authorship and creation date in legal proceedings. 
The digital signature ensures the authenticity and integrity of this certificate.

The Legato Platform provides this certificate as a service to content creators but does not 
provide legal advice. Authors should consult with qualified legal professionals regarding 
intellectual property matters.
        """.strip()
    
    def _generate_qr_code(self, url: str) -> str:
        """Generate QR code for certificate verification"""
        if not QR_CODE_AVAILABLE:
            return ""
            
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return qr_code_data
    
    def verify_certificate(self, certificate_data: Dict[str, Any], digital_signature: str) -> bool:
        """Verify the authenticity of a certificate"""
        return self.crypto_service.verify_digital_signature(certificate_data, digital_signature)
    
    def generate_certificate_html(self, certificate: Dict[str, Any]) -> str:
        """Generate HTML representation of the certificate"""
        
        template_str = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Authorship - {{ certificate_data.certificate_number }}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .certificate {
            background: white;
            padding: 60px;
            border: 3px solid #2c3e50;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .title {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 18px;
            color: #7f8c8d;
        }
        .content-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
        }
        .field {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #2c3e50;
        }
        .value {
            margin-left: 20px;
            font-family: 'Courier New', monospace;
        }
        .legal-statement {
            font-size: 12px;
            line-height: 1.6;
            color: #555;
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .verification {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #e8f5e8;
            border: 1px solid #27ae60;
        }
        .qr-code {
            margin: 20px 0;
        }
        .signature-section {
            margin-top: 40px;
            text-align: right;
        }
        .hash {
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="title">Certificate of Authorship</div>
            <div class="subtitle">{{ certificate_data.platform }}</div>
        </div>
        
        <div class="content-section">
            <h3>Certificate Information</h3>
            <div class="field">
                <span class="label">Certificate Number:</span>
                <span class="value">{{ certificate_data.certificate_number }}</span>
            </div>
            <div class="field">
                <span class="label">Issued Date:</span>
                <span class="value">{{ certificate_data.issued_at }}</span>
            </div>
        </div>
        
        <div class="content-section">
            <h3>Content Information</h3>
            <div class="field">
                <span class="label">Title:</span>
                <span class="value">{{ certificate_data.content.title }}</span>
            </div>
            <div class="field">
                <span class="label">Content Type:</span>
                <span class="value">{{ certificate_data.content.type }}</span>
            </div>
            <div class="field">
                <span class="label">Content ID:</span>
                <span class="value">{{ certificate_data.content.id }}</span>
            </div>
            <div class="field">
                <span class="label">Digital Fingerprint (SHA-256):</span>
                <div class="value hash">{{ certificate_data.content.hash }}</div>
            </div>
        </div>
        
        <div class="content-section">
            <h3>Author Information</h3>
            <div class="field">
                <span class="label">Author ID:</span>
                <span class="value">{{ certificate_data.author.id }}</span>
            </div>
            <div class="field">
                <span class="label">Author Name:</span>
                <span class="value">{{ certificate_data.author.name }}</span>
            </div>
        </div>
        
        <div class="content-section">
            <h3>Registration Details</h3>
            <div class="field">
                <span class="label">Registration ID:</span>
                <span class="value">{{ certificate_data.registration.id }}</span>
            </div>
            <div class="field">
                <span class="label">Timestamp:</span>
                <span class="value">{{ certificate_data.registration.timestamp }}</span>
            </div>
            <div class="field">
                <span class="label">Timestamp Authority:</span>
                <span class="value">{{ certificate_data.registration.timestamp_authority or 'Legato Internal' }}</span>
            </div>
            <div class="field">
                <span class="label">Verification Method:</span>
                <span class="value">{{ certificate_data.registration.verification_method }}</span>
            </div>
        </div>
        
        <div class="legal-statement">
            {{ certificate_data.legal_statement }}
        </div>
        
        <div class="verification">
            <h3>Certificate Verification</h3>
            <p>Verify this certificate online at:</p>
            <p><strong>{{ certificate_data.verification.url }}</strong></p>
            {% if qr_code_data %}
            <div class="qr-code">
                <img src="data:image/png;base64,{{ qr_code_data }}" alt="QR Code for verification" />
            </div>
            {% endif %}
        </div>
        
        <div class="signature-section">
            <p><strong>{{ certificate_data.platform }}</strong></p>
            <p>Digital Certificate Authority</p>
            <p style="font-size: 12px; color: #666;">
                Digital Signature: {{ digital_signature[:32] }}...
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        template = Template(template_str)
        return template.render(
            certificate_data=certificate["certificate_data"],
            digital_signature=certificate["digital_signature"],
            qr_code_data=certificate.get("qr_code_data")
        )
    
    def generate_certificate_json(self, certificate: Dict[str, Any]) -> str:
        """Generate JSON representation of the certificate for API responses"""
        return json.dumps({
            "certificate": certificate["certificate_data"],
            "digital_signature": certificate["digital_signature"],
            "verification_url": certificate["certificate_data"]["verification"]["url"],
            "issued_at": certificate["issued_at"].isoformat() if isinstance(certificate["issued_at"], datetime) else certificate["issued_at"],
            "status": certificate["status"]
        }, indent=2)