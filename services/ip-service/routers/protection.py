from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
import json

from models import IPRegistration, AuthorshipCertificate, ContentHash
from crypto_service import CryptographicProtectionService, TimestampAuthorityService
from certificate_service import CertificateOfAuthorshipService
from database import get_db
from schemas import (
    ContentRegistrationRequest, 
    ContentRegistrationResponse,
    CertificateRequest,
    CertificateResponse,
    HashVerificationRequest,
    HashVerificationResponse
)

router = APIRouter(prefix="/protection", tags=["IP Protection"])

crypto_service = CryptographicProtectionService()
timestamp_service = TimestampAuthorityService()
certificate_service = CertificateOfAuthorshipService()

@router.post("/register", response_model=ContentRegistrationResponse)
async def register_content(
    request: ContentRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Register content with cryptographic protection"""
    try:
        # Generate content hash
        content_hash = crypto_service.generate_content_hash(
            request.content,
            request.metadata
        )
        
        # Check if content already registered
        existing = db.query(IPRegistration).filter(
            IPRegistration.content_hash == content_hash
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Content with this hash already registered"
            )
        
        # Get timestamp token
        timestamp_data = timestamp_service.get_timestamp_token(content_hash)
        
        # Create IP registration
        registration = IPRegistration(
            content_id=request.content_id,
            content_hash=content_hash,
            content_type=request.content_type,
            author_id=request.author_id,
            title=request.title,
            timestamp_authority=timestamp_data.get("authority"),
            timestamp_token=timestamp_data.get("token") if timestamp_data else None,
            verification_method="sha256_timestamp"
        )
        
        db.add(registration)
        db.commit()
        db.refresh(registration)
        
        # Create content hash record
        content_hash_record = ContentHash(
            registration_id=registration.id,
            content_hash=content_hash,
            content_length=len(request.content),
            verification_status="verified"
        )
        
        db.add(content_hash_record)
        db.commit()
        
        return ContentRegistrationResponse(
            registration_id=registration.id,
            content_hash=content_hash,
            timestamp=registration.timestamp,
            timestamp_authority=registration.timestamp_authority,
            verification_url=f"/api/ip/verify/{registration.id}",
            status="registered"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/certificate", response_model=CertificateResponse)
async def generate_certificate(
    request: CertificateRequest,
    db: Session = Depends(get_db)
):
    """Generate Certificate of Authorship"""
    try:
        # Get registration record
        registration = db.query(IPRegistration).filter(
            IPRegistration.id == request.registration_id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )
        
        # Check if certificate already exists
        existing_cert = db.query(AuthorshipCertificate).filter(
            AuthorshipCertificate.registration_id == request.registration_id
        ).first()
        
        if existing_cert and not request.regenerate:
            return CertificateResponse(
                certificate_id=existing_cert.id,
                certificate_number=existing_cert.certificate_number,
                certificate_url=existing_cert.pdf_url,
                verification_url=f"/api/ip/verify/certificate/{existing_cert.certificate_number}",
                issued_at=existing_cert.issued_at,
                status=existing_cert.status
            )
        
        # Prepare registration data for certificate
        registration_data = {
            "registration_id": registration.id,
            "content_id": registration.content_id,
            "title": registration.title,
            "content_type": registration.content_type,
            "content_hash": registration.content_hash,
            "author_id": registration.author_id,
            "author_name": request.author_name,
            "timestamp": registration.timestamp.isoformat(),
            "timestamp_authority": registration.timestamp_authority,
            "verification_method": registration.verification_method
        }
        
        # Generate certificate
        certificate_data = certificate_service.generate_certificate(registration_data)
        
        # Save certificate to database
        if existing_cert and request.regenerate:
            # Update existing certificate
            existing_cert.certificate_data = json.dumps(certificate_data["certificate_data"])
            existing_cert.digital_signature = certificate_data["digital_signature"]
            existing_cert.issued_at = datetime.utcnow()
            existing_cert.status = "active"
            db.commit()
            certificate_record = existing_cert
        else:
            # Create new certificate
            certificate_record = AuthorshipCertificate(
                registration_id=registration.id,
                certificate_number=certificate_data["certificate_number"],
                certificate_data=json.dumps(certificate_data["certificate_data"]),
                digital_signature=certificate_data["digital_signature"],
                status="active"
            )
            db.add(certificate_record)
            db.commit()
            db.refresh(certificate_record)
        
        return CertificateResponse(
            certificate_id=certificate_record.id,
            certificate_number=certificate_record.certificate_number,
            certificate_url=f"/api/ip/certificate/{certificate_record.certificate_number}/download",
            verification_url=f"/api/ip/verify/certificate/{certificate_record.certificate_number}",
            issued_at=certificate_record.issued_at,
            status=certificate_record.status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate generation failed: {str(e)}"
        )

@router.post("/verify-hash", response_model=HashVerificationResponse)
async def verify_content_hash(request: HashVerificationRequest):
    """Verify content against its hash"""
    try:
        is_valid = crypto_service.verify_content_hash(
            request.content,
            request.expected_hash,
            request.metadata
        )
        
        return HashVerificationResponse(
            is_valid=is_valid,
            expected_hash=request.expected_hash,
            computed_hash=crypto_service.generate_content_hash(
                request.content, 
                request.metadata
            ),
            verification_method="sha256",
            verified_at=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hash verification failed: {str(e)}"
        )

@router.get("/verify/{registration_id}")
async def verify_registration(
    registration_id: str,
    db: Session = Depends(get_db)
):
    """Verify IP registration by ID"""
    try:
        registration = db.query(IPRegistration).filter(
            IPRegistration.id == registration_id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )
        
        # Get associated records
        content_hash = db.query(ContentHash).filter(
            ContentHash.registration_id == registration_id
        ).first()
        
        certificates = db.query(AuthorshipCertificate).filter(
            AuthorshipCertificate.registration_id == registration_id
        ).all()
        
        return {
            "registration": {
                "id": registration.id,
                "content_id": registration.content_id,
                "content_hash": registration.content_hash,
                "content_type": registration.content_type,
                "author_id": registration.author_id,
                "title": registration.title,
                "timestamp": registration.timestamp,
                "timestamp_authority": registration.timestamp_authority,
                "verification_method": registration.verification_method,
                "is_verified": registration.is_verified,
                "created_at": registration.created_at
            },
            "content_hash": {
                "hash_algorithm": content_hash.hash_algorithm if content_hash else None,
                "content_length": content_hash.content_length if content_hash else None,
                "verification_status": content_hash.verification_status if content_hash else None,
                "last_verified_at": content_hash.last_verified_at if content_hash else None
            } if content_hash else None,
            "certificates": [
                {
                    "id": cert.id,
                    "certificate_number": cert.certificate_number,
                    "issued_at": cert.issued_at,
                    "status": cert.status
                }
                for cert in certificates
            ],
            "verification_status": "verified" if registration.is_verified else "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

@router.get("/certificate/{certificate_number}")
async def get_certificate(
    certificate_number: str,
    format: str = "json",
    db: Session = Depends(get_db)
):
    """Get certificate by certificate number"""
    try:
        certificate = db.query(AuthorshipCertificate).filter(
            AuthorshipCertificate.certificate_number == certificate_number
        ).first()
        
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found"
            )
        
        certificate_data = json.loads(certificate.certificate_data)
        
        if format.lower() == "html":
            # Return HTML certificate
            html_content = certificate_service.generate_certificate_html({
                "certificate_data": certificate_data,
                "digital_signature": certificate.digital_signature,
                "qr_code_data": None  # QR code will be generated in template
            })
            
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=html_content)
        
        else:
            # Return JSON certificate
            return {
                "certificate": certificate_data,
                "digital_signature": certificate.digital_signature,
                "certificate_number": certificate.certificate_number,
                "issued_at": certificate.issued_at,
                "status": certificate.status,
                "verification_url": f"/api/ip/verify/certificate/{certificate_number}"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate retrieval failed: {str(e)}"
        )