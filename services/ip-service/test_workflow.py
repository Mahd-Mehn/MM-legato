import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json
from decimal import Decimal

from main import app
from workflow_service import LicensingWorkflowService, WorkflowStatus, RevenueDistributionStatus, AdaptationRights

client = TestClient(app)
workflow_service = LicensingWorkflowService()

class TestWorkflowService:
    """Test workflow service functionality"""
    
    def test_create_licensing_workflow(self):
        """Test creating licensing workflow"""
        agreement_id = "LIC-20240210150000-ABCD1234"
        registration_id = "reg_123"
        studio_id = "studio_456"
        writer_id = "writer_789"
        license_terms = {
            "license_type": "adaptation",
            "revenue_share_percentage": 35.0,
            "duration_months": 60,
            "territory": "worldwide",
            "adaptation_rights": ["film", "streaming"]
        }
        
        workflow = workflow_service.create_licensing_workflow(
            agreement_id=agreement_id,
            registration_id=registration_id,
            studio_id=studio_id,
            writer_id=writer_id,
            license_terms=license_terms
        )
        
        assert "workflow_id" in workflow
        assert workflow["agreement_id"] == agreement_id
        assert workflow["registration_id"] == registration_id
        assert workflow["studio_id"] == studio_id
        assert workflow["writer_id"] == writer_id
        assert workflow["status"] == WorkflowStatus.DRAFT.value
        assert len(workflow["steps"]) > 0
        assert len(workflow["milestones"]) > 0
        assert "revenue_tracking" in workflow
        assert "adaptation_tracking" in workflow
    
    def test_process_revenue_distribution(self):
        """Test revenue distribution processing"""
        workflow_id = "WF-20240210150000-ABCD1234"
        gross_revenue = 10000.0
        period_start = datetime(2024, 2, 1)
        period_end = datetime(2024, 2, 29)
        
        distribution = workflow_service.process_revenue_distribution(
            workflow_id=workflow_id,
            gross_revenue=gross_revenue,
            period_start=period_start,
            period_end=period_end,
            revenue_source="licensing_fees"
        )
        
        assert "distribution_id" in distribution
        assert distribution["workflow_id"] == workflow_id
        assert distribution["status"] == RevenueDistributionStatus.PENDING.value
        
        # Check revenue calculations
        gross = float(distribution["gross_revenue"])
        platform_fee = float(distribution["platform_fee"])
        writer_share = float(distribution["writer_share"])
        studio_share = float(distribution["studio_share"])
        
        assert gross == gross_revenue
        assert platform_fee == gross_revenue * 0.15  # 15% platform fee
        assert writer_share + studio_share + platform_fee == gross_revenue
        assert writer_share > studio_share  # Writers get larger share
    
    def test_track_adaptation_progress(self):
        """Test adaptation progress tracking"""
        workflow_id = "WF-20240210150000-ABCD1234"
        milestone_id = "script_completion"
        status = "completed"
        completion_date = datetime.utcnow()
        notes = "First draft completed ahead of schedule"
        performance_data = {
            "quality_score": 8.5,
            "timeline_adherence": 1.1
        }
        
        result = workflow_service.track_adaptation_progress(
            workflow_id=workflow_id,
            milestone_id=milestone_id,
            status=status,
            completion_date=completion_date,
            notes=notes,
            performance_data=performance_data
        )
        
        assert result["workflow_id"] == workflow_id
        assert result["status"] == "updated"
        assert "milestone_update" in result
        
        milestone_update = result["milestone_update"]
        assert milestone_update["milestone_id"] == milestone_id
        assert milestone_update["status"] == status
        assert milestone_update["notes"] == notes
        assert milestone_update["performance_data"] == performance_data
    
    def test_generate_licensing_analytics(self):
        """Test licensing analytics generation"""
        workflow_id = "WF-20240210150000-ABCD1234"
        time_period = "last_30_days"
        
        analytics = workflow_service.generate_licensing_analytics(
            workflow_id=workflow_id,
            time_period=time_period
        )
        
        assert analytics["workflow_id"] == workflow_id
        assert analytics["time_period"] == time_period
        assert "revenue_performance" in analytics
        assert "adaptation_progress" in analytics
        assert "rights_utilization" in analytics
        assert "financial_projections" in analytics
        
        # Check revenue performance structure
        revenue_perf = analytics["revenue_performance"]
        assert "total_revenue" in revenue_perf
        assert "writer_earnings" in revenue_perf
        assert "studio_earnings" in revenue_perf
        assert "platform_earnings" in revenue_perf
        assert "growth_rate" in revenue_perf
    
    def test_manage_licensing_disputes(self):
        """Test licensing dispute management"""
        workflow_id = "WF-20240210150000-ABCD1234"
        dispute_type = "payment_dispute"
        description = "Milestone payment was not processed correctly"
        raised_by = "writer_789"
        
        dispute = workflow_service.manage_licensing_disputes(
            workflow_id=workflow_id,
            dispute_type=dispute_type,
            description=description,
            raised_by=raised_by
        )
        
        assert "dispute_id" in dispute
        assert dispute["workflow_id"] == workflow_id
        assert dispute["dispute_type"] == dispute_type
        assert dispute["description"] == description
        assert dispute["raised_by"] == raised_by
        assert dispute["status"] == "open"
        assert dispute["priority"] == "high"  # Payment disputes are high priority
        assert len(dispute["resolution_steps"]) > 0
    
    def test_revenue_calculation_precision(self):
        """Test revenue calculation precision with Decimal"""
        workflow_id = "WF-20240210150000-ABCD1234"
        gross_revenue = 1234.56
        period_start = datetime(2024, 2, 1)
        period_end = datetime(2024, 2, 29)
        
        distribution = workflow_service.process_revenue_distribution(
            workflow_id=workflow_id,
            gross_revenue=gross_revenue,
            period_start=period_start,
            period_end=period_end
        )
        
        # Check that calculations are precise to 2 decimal places
        gross = Decimal(distribution["gross_revenue"])
        platform_fee = Decimal(distribution["platform_fee"])
        writer_share = Decimal(distribution["writer_share"])
        studio_share = Decimal(distribution["studio_share"])
        
        # Verify total adds up correctly
        total = platform_fee + writer_share + studio_share
        assert total == gross
        
        # Check decimal precision
        assert len(str(platform_fee).split('.')[-1]) <= 2
        assert len(str(writer_share).split('.')[-1]) <= 2
        assert len(str(studio_share).split('.')[-1]) <= 2

class TestWorkflowAPI:
    """Test workflow API endpoints"""
    
    def test_create_workflow_endpoint(self):
        """Test workflow creation endpoint"""
        workflow_data = {
            "agreement_id": "LIC-20240210150000-ABCD1234",
            "studio_id": "studio_456",
            "writer_id": "writer_789",
            "license_terms": {
                "license_type": "adaptation",
                "revenue_share_percentage": 35.0,
                "duration_months": 60,
                "territory": "worldwide"
            }
        }
        
        response = client.post(
            "/api/ip/workflow/create",
            json=workflow_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "workflow_id" in data
        assert data["agreement_id"] == workflow_data["agreement_id"]
        assert data["studio_id"] == workflow_data["studio_id"]
        assert data["writer_id"] == workflow_data["writer_id"]
    
    def test_revenue_distribution_endpoint(self):
        """Test revenue distribution endpoint"""
        distribution_data = {
            "workflow_id": "WF-20240210150000-ABCD1234",
            "gross_revenue": 5000.0,
            "period_start": "2024-02-01T00:00:00",
            "period_end": "2024-02-29T23:59:59",
            "revenue_source": "milestone_payment"
        }
        
        response = client.post(
            "/api/ip/workflow/revenue/distribute",
            json=distribution_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "distribution_id" in data
        assert data["workflow_id"] == distribution_data["workflow_id"]
        assert float(data["gross_revenue"]) == distribution_data["gross_revenue"]
    
    def test_milestone_update_endpoint(self):
        """Test milestone update endpoint"""
        milestone_data = {
            "workflow_id": "WF-20240210150000-ABCD1234",
            "milestone_id": "script_completion",
            "status": "completed",
            "completion_date": "2024-02-15T10:00:00",
            "notes": "Script completed successfully",
            "performance_data": {
                "quality_score": 9.0
            }
        }
        
        response = client.post(
            "/api/ip/workflow/milestone/update",
            json=milestone_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_id"] == milestone_data["workflow_id"]
        assert data["status"] == "updated"
    
    def test_analytics_endpoint(self):
        """Test analytics endpoint"""
        workflow_id = "WF-20240210150000-ABCD1234"
        
        response = client.get(
            f"/api/ip/workflow/analytics/{workflow_id}",
            params={"time_period": "last_30_days"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_id"] == workflow_id
        assert "revenue_performance" in data
        assert "adaptation_progress" in data
    
    def test_dispute_creation_endpoint(self):
        """Test dispute creation endpoint"""
        dispute_data = {
            "workflow_id": "WF-20240210150000-ABCD1234",
            "dispute_type": "milestone_disagreement",
            "description": "Disagreement about milestone completion criteria",
            "raised_by": "writer_789"
        }
        
        response = client.post(
            "/api/ip/workflow/dispute/create",
            json=dispute_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "dispute_id" in data
        assert data["workflow_id"] == dispute_data["workflow_id"]
        assert data["dispute_type"] == dispute_data["dispute_type"]
    
    def test_revenue_calculation_endpoint(self):
        """Test revenue calculation endpoint"""
        response = client.get(
            "/api/ip/workflow/revenue/calculate",
            params={
                "gross_revenue": 10000.0,
                "platform_fee_percentage": 15.0,
                "writer_percentage": 85.0
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["gross_revenue"] == 10000.0
        assert data["platform_fee"] == 1500.0
        assert data["net_revenue"] == 8500.0
        assert data["writer_share"] == 7225.0
        assert data["studio_share"] == 1275.0
    
    def test_workflow_status_endpoint(self):
        """Test workflow status endpoint"""
        workflow_id = "WF-20240210150000-ABCD1234"
        
        response = client.get(f"/api/ip/workflow/workflow/{workflow_id}/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_id"] == workflow_id
        assert "status" in data
        assert "current_step" in data
        assert "steps" in data
        assert "milestones" in data
    
    def test_revenue_history_endpoint(self):
        """Test revenue history endpoint"""
        workflow_id = "WF-20240210150000-ABCD1234"
        
        response = client.get(
            f"/api/ip/workflow/revenue/history/{workflow_id}",
            params={"limit": 10, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_id"] == workflow_id
        assert "revenue_history" in data
        assert "total_revenue" in data
        assert "total_writer_earnings" in data
    
    def test_adaptation_rights_info_endpoint(self):
        """Test adaptation rights info endpoint"""
        response = client.get("/api/ip/workflow/adaptation/rights")
        
        assert response.status_code == 200
        data = response.json()
        assert "adaptation_rights" in data
        assert "total_types" in data
        
        # Check that all adaptation rights are included
        rights_values = [right["right_type"] for right in data["adaptation_rights"]]
        expected_rights = [right.value for right in AdaptationRights]
        assert set(rights_values) == set(expected_rights)
    
    def test_workflow_templates_endpoint(self):
        """Test workflow templates endpoint"""
        response = client.get("/api/ip/workflow/workflow/templates")
        
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "total_count" in data
        assert len(data["templates"]) > 0
        
        # Check template structure
        for template in data["templates"]:
            assert "template_id" in template
            assert "name" in template
            assert "description" in template
            assert "license_type" in template
            assert "steps" in template

if __name__ == "__main__":
    pytest.main([__file__])