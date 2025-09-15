from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
import logging
from decimal import Decimal
from datetime import datetime, timedelta

from database import get_db
from revenue_service import RevenueDistributionService
from models import TransactionType, TransactionStatus, CurrencyType
from schemas import (
    PayoutRequestCreate, PayoutRequestResponse,
    TransactionSummary, CurrencyType as SchemaCurrencyType
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency to get revenue service
def get_revenue_service(db: Session = Depends(get_db)) -> RevenueDistributionService:
    return RevenueDistributionService(db)

# Revenue Distribution Endpoints
@router.post("/content-purchase/{transaction_id}/distribute")
async def distribute_content_purchase_revenue(
    transaction_id: uuid.UUID,
    writer_id: uuid.UUID,
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Distribute revenue from a content purchase to the writer"""
    try:
        revenue_record = revenue_service.process_content_purchase_revenue(transaction_id, writer_id)
        return {
            "message": "Revenue distributed successfully",
            "transaction_id": transaction_id,
            "writer_id": writer_id,
            "writer_amount": revenue_record["writer_amount"],
            "platform_amount": revenue_record["platform_amount"],
            "currency": revenue_record["currency"].value
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error distributing content purchase revenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subscription-pool/distribute")
async def distribute_subscription_revenue_pool(
    period_days: int = Query(30, description="Number of days for the distribution period"),
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Distribute subscription revenue pool based on engagement metrics"""
    try:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=period_days)
        
        distributions = revenue_service.process_subscription_revenue_pool(period_start, period_end)
        
        total_distributed = sum(d["revenue_share"] for d in distributions)
        
        return {
            "message": "Subscription revenue pool distributed successfully",
            "period_start": period_start,
            "period_end": period_end,
            "writers_count": len(distributions),
            "total_distributed": total_distributed,
            "distributions": distributions
        }
    except Exception as e:
        logger.error(f"Error distributing subscription revenue pool: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Payout Management Endpoints
@router.post("/writers/{writer_id}/payout-requests", response_model=PayoutRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_payout_request(
    writer_id: uuid.UUID,
    payout_data: PayoutRequestCreate,
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Create a new payout request for a writer"""
    try:
        payout_request = revenue_service.create_payout_request(writer_id, payout_data)
        return PayoutRequestResponse(**payout_request.__dict__)
    except Exception as e:
        logger.error(f"Error creating payout request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writers/{writer_id}/payout-requests", response_model=List[PayoutRequestResponse])
async def get_writer_payout_requests(
    writer_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Get payout requests for a writer"""
    try:
        payout_requests = revenue_service.get_writer_payout_requests(writer_id, limit)
        return [PayoutRequestResponse(**pr.__dict__) for pr in payout_requests]
    except Exception as e:
        logger.error(f"Error getting writer payout requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payout-requests/{payout_id}/process")
async def process_payout_request(
    payout_id: uuid.UUID,
    external_payout_id: Optional[str] = None,
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Process a payout request (Admin only)"""
    try:
        payout_request = revenue_service.process_payout_request(payout_id, external_payout_id)
        return {
            "message": "Payout processed successfully",
            "payout_id": payout_id,
            "amount": payout_request.amount,
            "currency": payout_request.currency.value,
            "processed_at": payout_request.processed_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing payout request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Earnings and Analytics Endpoints
@router.get("/writers/{writer_id}/earnings")
async def get_writer_earnings_summary(
    writer_id: uuid.UUID,
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Get earnings summary for a writer"""
    try:
        earnings_summary = revenue_service.get_writer_earnings_summary(writer_id)
        return earnings_summary
    except Exception as e:
        logger.error(f"Error getting writer earnings summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue-shares/calculate")
async def calculate_revenue_share(
    transaction_type: TransactionType,
    amount: Decimal = Query(..., gt=0),
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Calculate revenue share for a given transaction type and amount"""
    try:
        revenue_share = revenue_service.calculate_revenue_share(transaction_type, amount)
        return {
            "transaction_type": transaction_type.value,
            "total_amount": amount,
            "writer_share": revenue_share["writer_share"],
            "platform_share": revenue_share["platform_share"],
            "writer_percentage": revenue_share["writer_percentage"],
            "platform_percentage": revenue_share["platform_percentage"]
        }
    except Exception as e:
        logger.error(f"Error calculating revenue share: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Financial Reporting Endpoints
@router.get("/reports/revenue")
async def generate_revenue_report(
    period_days: int = Query(30, description="Number of days for the report period"),
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Generate revenue report for a given period (Admin only)"""
    try:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=period_days)
        
        report = revenue_service.generate_revenue_report(period_start, period_end)
        return report
    except Exception as e:
        logger.error(f"Error generating revenue report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/revenue/summary")
async def get_revenue_summary(
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Get high-level revenue summary"""
    try:
        # Get reports for different periods
        today = datetime.utcnow()
        
        # Last 7 days
        week_start = today - timedelta(days=7)
        week_report = revenue_service.generate_revenue_report(week_start, today)
        
        # Last 30 days
        month_start = today - timedelta(days=30)
        month_report = revenue_service.generate_revenue_report(month_start, today)
        
        # Last 90 days
        quarter_start = today - timedelta(days=90)
        quarter_report = revenue_service.generate_revenue_report(quarter_start, today)
        
        return {
            "last_7_days": {
                "total_revenue": week_report["total_revenue"],
                "writer_share": week_report["total_writer_share"],
                "platform_share": week_report["total_platform_share"]
            },
            "last_30_days": {
                "total_revenue": month_report["total_revenue"],
                "writer_share": month_report["total_writer_share"],
                "platform_share": month_report["total_platform_share"]
            },
            "last_90_days": {
                "total_revenue": quarter_report["total_revenue"],
                "writer_share": quarter_report["total_writer_share"],
                "platform_share": quarter_report["total_platform_share"]
            },
            "revenue_sharing_config": revenue_service.REVENUE_SHARES
        }
    except Exception as e:
        logger.error(f"Error getting revenue summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tax and Compliance Endpoints
@router.get("/writers/{writer_id}/tax-report")
async def generate_writer_tax_report(
    writer_id: uuid.UUID,
    year: int = Query(..., description="Tax year"),
    revenue_service: RevenueDistributionService = Depends(get_revenue_service)
):
    """Generate tax report for a writer for a specific year"""
    try:
        # Calculate year boundaries
        year_start = datetime(year, 1, 1)
        year_end = datetime(year, 12, 31, 23, 59, 59)
        
        # Get writer earnings for the year
        earnings_summary = revenue_service.get_writer_earnings_summary(writer_id)
        
        # Get all payout requests for the year
        payout_requests = revenue_service.get_writer_payout_requests(writer_id, limit=1000)
        year_payouts = [
            pr for pr in payout_requests 
            if pr.processed_at and year_start <= pr.processed_at <= year_end
        ]
        
        total_paid_in_year = sum(pr.amount for pr in year_payouts)
        
        return {
            "writer_id": writer_id,
            "tax_year": year,
            "total_earnings": earnings_summary["total_earnings"],
            "total_paid_out": total_paid_in_year,
            "payouts_count": len(year_payouts),
            "payouts_detail": [
                {
                    "date": pr.processed_at,
                    "amount": pr.amount,
                    "currency": pr.currency.value,
                    "payment_method": pr.payment_method
                } for pr in year_payouts
            ],
            "generated_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error generating writer tax report: {e}")
        raise HTTPException(status_code=500, detail=str(e))