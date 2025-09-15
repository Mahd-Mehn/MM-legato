from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class IPRegistration(Base):
    """Core IP registration record with cryptographic proof"""
    __tablename__ = "ip_registrations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String, nullable=False, index=True)
    content_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 hash
    content_type = Column(String(50), nullable=False)  # 'story', 'chapter', etc.
    author_id = Column(String, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    
    # Timestamp authority data
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    timestamp_authority = Column(String(100), nullable=True)  # TSA provider
    timestamp_token = Column(Text, nullable=True)  # RFC 3161 timestamp token
    
    # Certificate data
    certificate_id = Column(String, nullable=True)
    certificate_url = Column(String(500), nullable=True)
    
    # Verification status
    is_verified = Column(Boolean, default=True)
    verification_method = Column(String(50), default="sha256_timestamp")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    certificates = relationship("AuthorshipCertificate", back_populates="registration")
    blockchain_records = relationship("BlockchainRecord", back_populates="registration")

class AuthorshipCertificate(Base):
    """Digital Certificate of Authorship"""
    __tablename__ = "authorship_certificates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String, ForeignKey("ip_registrations.id"), nullable=False)
    
    # Certificate metadata
    certificate_number = Column(String(50), unique=True, nullable=False)
    issued_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    
    # Certificate content
    certificate_data = Column(Text, nullable=False)  # JSON certificate content
    digital_signature = Column(Text, nullable=False)  # Platform signature
    
    # File storage
    pdf_url = Column(String(500), nullable=True)  # Generated PDF certificate
    
    status = Column(String(20), default="active")  # active, revoked, expired
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    registration = relationship("IPRegistration", back_populates="certificates")

class ContentHash(Base):
    """Content hash verification records"""
    __tablename__ = "content_hashes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String, ForeignKey("ip_registrations.id"), nullable=False)
    
    # Hash details
    hash_algorithm = Column(String(20), default="sha256")
    content_hash = Column(String(64), nullable=False)
    content_length = Column(Integer, nullable=False)
    
    # Verification data
    verification_attempts = Column(Integer, default=0)
    last_verified_at = Column(DateTime, nullable=True)
    verification_status = Column(String(20), default="pending")  # pending, verified, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)

class BlockchainRecord(Base):
    """Optional blockchain registration records"""
    __tablename__ = "blockchain_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String, ForeignKey("ip_registrations.id"), nullable=False)
    
    # Blockchain details
    blockchain_network = Column(String(50), nullable=False)  # ethereum, polygon, etc.
    transaction_hash = Column(String(66), nullable=False, unique=True)
    block_number = Column(Integer, nullable=True)
    contract_address = Column(String(42), nullable=True)
    
    # Transaction data
    gas_used = Column(Integer, nullable=True)
    transaction_fee = Column(String(50), nullable=True)  # In wei or smallest unit
    
    status = Column(String(20), default="pending")  # pending, confirmed, failed
    confirmations = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    
    # Relationships
    registration = relationship("IPRegistration", back_populates="blockchain_records")

class LicensingAgreement(Base):
    """Licensing agreements for IP"""
    __tablename__ = "licensing_agreements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agreement_id = Column(String(50), unique=True, nullable=False)
    registration_id = Column(String, ForeignKey("ip_registrations.id"), nullable=False)
    
    # Parties
    licensor_id = Column(String, nullable=False, index=True)
    licensee_id = Column(String, nullable=False, index=True)
    
    # Agreement details
    license_type = Column(String(50), nullable=False)
    terms_data = Column(Text, nullable=False)  # JSON terms
    custom_clauses = Column(Text, nullable=True)  # JSON custom clauses
    
    # Dates
    effective_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    
    # Status and tracking
    status = Column(String(20), default="draft")  # draft, pending, active, expired, terminated
    contract_url = Column(String(500), nullable=True)
    
    # Financial tracking
    total_revenue = Column(String(20), default="0.00")  # Stored as string to avoid precision issues
    licensor_earnings = Column(String(20), default="0.00")
    licensee_earnings = Column(String(20), default="0.00")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    registration = relationship("IPRegistration")

class MarketplaceListing(Base):
    """Marketplace listings for licensing opportunities"""
    __tablename__ = "marketplace_listings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(50), unique=True, nullable=False)
    registration_id = Column(String, ForeignKey("ip_registrations.id"), nullable=False)
    
    # Listing details
    available_licenses = Column(Text, nullable=False)  # JSON array of available licenses
    content_metadata = Column(Text, nullable=False)  # JSON content metadata
    
    # Tracking
    status = Column(String(20), default="active")  # active, paused, closed
    views = Column(Integer, default=0)
    inquiries = Column(Integer, default=0)
    active_licenses = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    registration = relationship("IPRegistration")

class RevenueDistribution(Base):
    """Revenue distribution records"""
    __tablename__ = "revenue_distributions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agreement_id = Column(String, ForeignKey("licensing_agreements.agreement_id"), nullable=False)
    
    # Revenue details
    gross_revenue = Column(String(20), nullable=False)
    platform_fee = Column(String(20), nullable=False)
    licensor_share = Column(String(20), nullable=False)
    licensee_share = Column(String(20), nullable=False)
    
    # Distribution metadata
    distribution_date = Column(DateTime, default=datetime.utcnow)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Status
    status = Column(String(20), default="pending")  # pending, completed, failed
    transaction_reference = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)