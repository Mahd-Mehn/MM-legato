from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from models import IPRegistration, BlockchainRecord
from blockchain_service import BlockchainService
from database import get_db
from schemas import (
    BlockchainRegistrationRequest,
    BlockchainRegistrationResponse,
    PlagiarismCheckRequest,
    PlagiarismCheckResponse,
    PlagiarismMatch
)

router = APIRouter(prefix="/blockchain", tags=["Blockchain Integration"])

blockchain_service = BlockchainService()

@router.post("/register", response_model=BlockchainRegistrationResponse)
async def register_on_blockchain(
    request: BlockchainRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Register IP on blockchain for enhanced protection"""
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
        
        # Check if already registered on blockchain
        existing_blockchain = db.query(BlockchainRecord).filter(
            BlockchainRecord.registration_id == request.registration_id,
            BlockchainRecord.blockchain_network == request.blockchain_network
        ).first()
        
        if existing_blockchain:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Already registered on {request.blockchain_network} blockchain"
            )
        
        # Register on blockchain
        blockchain_result = blockchain_service.register_ip_on_blockchain(
            registration_id=request.registration_id,
            content_hash=registration.content_hash,
            author_id=registration.author_id,
            network=request.blockchain_network,
            priority=request.priority
        )
        
        # Save blockchain record
        blockchain_record = BlockchainRecord(
            registration_id=request.registration_id,
            blockchain_network=request.blockchain_network,
            transaction_hash=blockchain_result["transaction_hash"],
            status=blockchain_result["status"],
            confirmations=blockchain_result.get("confirmations", 0)
        )
        
        db.add(blockchain_record)
        db.commit()
        db.refresh(blockchain_record)
        
        return BlockchainRegistrationResponse(
            blockchain_record_id=blockchain_record.id,
            transaction_hash=blockchain_result["transaction_hash"],
            blockchain_network=request.blockchain_network,
            status=blockchain_result["status"],
            estimated_confirmation_time=blockchain_result.get("estimated_confirmation_time")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Blockchain registration failed: {str(e)}"
        )

@router.get("/verify/{transaction_hash}")
async def verify_blockchain_transaction(
    transaction_hash: str,
    network: str,
    db: Session = Depends(get_db)
):
    """Verify blockchain transaction status"""
    try:
        # Get blockchain record
        blockchain_record = db.query(BlockchainRecord).filter(
            BlockchainRecord.transaction_hash == transaction_hash,
            BlockchainRecord.blockchain_network == network
        ).first()
        
        if not blockchain_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blockchain record not found"
            )
        
        # Verify on blockchain
        verification_result = blockchain_service.verify_blockchain_registration(
            transaction_hash, network
        )
        
        # Update record if status changed
        if verification_result["status"] != blockchain_record.status:
            blockchain_record.status = verification_result["status"]
            blockchain_record.confirmations = verification_result.get("confirmations", 0)
            blockchain_record.block_number = verification_result.get("block_number")
            
            if verification_result["status"] == "confirmed":
                blockchain_record.confirmed_at = datetime.utcnow()
            
            db.commit()
        
        return {
            "blockchain_record_id": blockchain_record.id,
            "registration_id": blockchain_record.registration_id,
            "transaction_hash": transaction_hash,
            "blockchain_network": network,
            "status": verification_result["status"],
            "block_number": verification_result.get("block_number"),
            "confirmations": verification_result.get("confirmations", 0),
            "gas_used": verification_result.get("gas_used"),
            "transaction_fee": verification_result.get("transaction_fee"),
            "verified_at": verification_result.get("verified_at"),
            "created_at": blockchain_record.created_at,
            "confirmed_at": blockchain_record.confirmed_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Blockchain verification failed: {str(e)}"
        )

@router.post("/plagiarism-check", response_model=PlagiarismCheckResponse)
async def check_plagiarism(
    request: PlagiarismCheckRequest,
    db: Session = Depends(get_db)
):
    """Check content for plagiarism using blockchain records"""
    try:
        # Get all blockchain records for comparison
        blockchain_records = db.query(BlockchainRecord).filter(
            BlockchainRecord.status == "confirmed"
        ).all()
        
        # Get registration details for blockchain records
        registration_data = []
        for record in blockchain_records:
            registration = db.query(IPRegistration).filter(
                IPRegistration.id == record.registration_id
            ).first()
            
            if registration and (not request.author_id or registration.author_id != request.author_id):
                registration_data.append({
                    "registration_id": registration.id,
                    "content_id": registration.content_id,
                    "content_hash": registration.content_hash,
                    "title": registration.title,
                    "author_id": registration.author_id,
                    "timestamp": registration.timestamp,
                    "blockchain_network": record.blockchain_network,
                    "transaction_hash": record.transaction_hash,
                    "block_number": record.block_number
                })
        
        # Create forensic proof
        content_hash = blockchain_service._calculate_similarity("", request.content)  # Simplified
        forensic_proof = blockchain_service.create_forensic_proof(
            original_hash="",  # We don't have original hash for comparison
            suspected_content=request.content,
            blockchain_records=registration_data
        )
        
        # Find potential matches
        matches = []
        for reg_data in registration_data:
            # Simple similarity check (in practice, use more sophisticated algorithms)
            similarity = blockchain_service._calculate_similarity(
                reg_data["content_hash"], 
                forensic_proof["suspected_hash"]
            )
            
            if similarity > 0.7:  # Threshold for potential match
                matches.append(PlagiarismMatch(
                    registration_id=reg_data["registration_id"],
                    content_id=reg_data["content_id"],
                    title=reg_data["title"],
                    author_id=reg_data["author_id"],
                    similarity_score=similarity,
                    matching_segments=[],  # Would be populated by content analysis
                    timestamp=reg_data["timestamp"]
                ))
        
        # Determine if content is original
        is_original = len(matches) == 0
        confidence_score = 1.0 - (max([m.similarity_score for m in matches]) if matches else 0.0)
        
        return PlagiarismCheckResponse(
            is_original=is_original,
            confidence_score=confidence_score,
            matches=matches,
            checked_at=datetime.utcnow(),
            total_registrations_checked=len(registration_data)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plagiarism check failed: {str(e)}"
        )

@router.get("/networks")
async def get_supported_networks():
    """Get list of supported blockchain networks"""
    try:
        networks = blockchain_service.get_supported_networks()
        return {
            "networks": networks,
            "blockchain_enabled": blockchain_service.enabled,
            "default_network": "polygon"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get networks: {str(e)}"
        )

@router.get("/forensic-proof/{analysis_id}")
async def get_forensic_proof(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """Get forensic proof report by analysis ID"""
    try:
        # In a real implementation, forensic proofs would be stored in database
        # For now, return a mock response
        
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "report_url": f"/api/ip/blockchain/forensic-proof/{analysis_id}/download",
            "created_at": datetime.utcnow().isoformat(),
            "blockchain_evidence_count": 5,
            "confidence_level": "high"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get forensic proof: {str(e)}"
        )

@router.get("/stats")
async def get_blockchain_stats(db: Session = Depends(get_db)):
    """Get blockchain registration statistics"""
    try:
        # Get blockchain registration counts by network
        blockchain_records = db.query(BlockchainRecord).all()
        
        stats = {
            "total_registrations": len(blockchain_records),
            "by_network": {},
            "by_status": {},
            "total_confirmations": 0
        }
        
        for record in blockchain_records:
            # Count by network
            network = record.blockchain_network
            if network not in stats["by_network"]:
                stats["by_network"][network] = 0
            stats["by_network"][network] += 1
            
            # Count by status
            status = record.status
            if status not in stats["by_status"]:
                stats["by_status"][status] = 0
            stats["by_status"][status] += 1
            
            # Sum confirmations
            stats["total_confirmations"] += record.confirmations or 0
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get blockchain stats: {str(e)}"
        )