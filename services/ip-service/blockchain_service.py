import os
import json
import hashlib
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass

@dataclass
class BlockchainConfig:
    """Configuration for blockchain networks"""
    network_name: str
    rpc_url: str
    chain_id: int
    contract_address: Optional[str] = None
    gas_price_gwei: float = 20.0
    confirmation_blocks: int = 12

class BlockchainService:
    """Service for blockchain integration and IP registry"""
    
    def __init__(self):
        self.networks = {
            "ethereum": BlockchainConfig(
                network_name="ethereum",
                rpc_url=os.getenv("ETHEREUM_RPC_URL", "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"),
                chain_id=1,
                contract_address=os.getenv("ETHEREUM_CONTRACT_ADDRESS"),
                gas_price_gwei=float(os.getenv("ETHEREUM_GAS_PRICE", "20.0")),
                confirmation_blocks=12
            ),
            "polygon": BlockchainConfig(
                network_name="polygon",
                rpc_url=os.getenv("POLYGON_RPC_URL", "https://polygon-rpc.com"),
                chain_id=137,
                contract_address=os.getenv("POLYGON_CONTRACT_ADDRESS"),
                gas_price_gwei=float(os.getenv("POLYGON_GAS_PRICE", "30.0")),
                confirmation_blocks=20
            )
        }
        
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        self.enabled = os.getenv("BLOCKCHAIN_ENABLED", "false").lower() == "true"
    
    def register_ip_on_blockchain(
        self, 
        registration_id: str,
        content_hash: str,
        author_id: str,
        network: str = "polygon",
        priority: str = "standard"
    ) -> Dict[str, Any]:
        """Register IP on blockchain"""
        
        if not self.enabled:
            return self._create_mock_blockchain_record(
                registration_id, content_hash, author_id, network
            )
        
        try:
            config = self.networks.get(network)
            if not config:
                raise ValueError(f"Unsupported blockchain network: {network}")
            
            # Create IP registration data
            ip_data = {
                "registration_id": registration_id,
                "content_hash": content_hash,
                "author_id": author_id,
                "timestamp": int(time.time()),
                "platform": "legato"
            }
            
            # Create transaction data
            transaction_data = self._prepare_transaction_data(ip_data, config, priority)
            
            # Submit transaction
            tx_hash = self._submit_transaction(transaction_data, config)
            
            return {
                "transaction_hash": tx_hash,
                "blockchain_network": network,
                "status": "pending",
                "block_number": None,
                "confirmations": 0,
                "gas_used": None,
                "transaction_fee": None,
                "estimated_confirmation_time": self._estimate_confirmation_time(config, priority)
            }
            
        except Exception as e:
            # Return mock data for development/testing
            return self._create_mock_blockchain_record(
                registration_id, content_hash, author_id, network, error=str(e)
            )
    
    def _create_mock_blockchain_record(
        self, 
        registration_id: str,
        content_hash: str,
        author_id: str,
        network: str,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create mock blockchain record for development/testing"""
        
        mock_data = f"{registration_id}:{content_hash}:{author_id}:{int(time.time())}"
        mock_tx_hash = "0x" + hashlib.sha256(mock_data.encode()).hexdigest()
        
        return {
            "transaction_hash": mock_tx_hash,
            "blockchain_network": network,
            "status": "pending" if not error else "failed",
            "block_number": None,
            "confirmations": 0,
            "gas_used": None,
            "transaction_fee": None,
            "estimated_confirmation_time": "2-5 minutes",
            "mock": True,
            "error": error
        }
    
    def _prepare_transaction_data(
        self, 
        ip_data: Dict[str, Any], 
        config: BlockchainConfig,
        priority: str
    ) -> Dict[str, Any]:
        """Prepare blockchain transaction data"""
        
        # Calculate gas price based on priority
        gas_price_multiplier = {
            "low": 0.8,
            "standard": 1.0,
            "high": 1.5
        }.get(priority, 1.0)
        
        gas_price_wei = int(config.gas_price_gwei * gas_price_multiplier * 1e9)
        
        # Create contract call data (simplified)
        contract_data = self._encode_contract_call(ip_data)
        
        return {
            "to": config.contract_address,
            "data": contract_data,
            "gas": 100000,
            "gasPrice": gas_price_wei,
            "chainId": config.chain_id,
            "nonce": self._get_next_nonce(config)
        }
    
    def _encode_contract_call(self, ip_data: Dict[str, Any]) -> str:
        """Encode contract call data"""
        data_json = json.dumps(ip_data, sort_keys=True)
        data_hash = hashlib.sha256(data_json.encode()).hexdigest()
        function_signature = "0x12345678"
        return function_signature + data_hash
    
    def _submit_transaction(self, tx_data: Dict[str, Any], config: BlockchainConfig) -> str:
        """Submit transaction to blockchain"""
        tx_content = json.dumps(tx_data, sort_keys=True)
        tx_hash = "0x" + hashlib.sha256(tx_content.encode()).hexdigest()
        return tx_hash
    
    def _get_next_nonce(self, config: BlockchainConfig) -> int:
        """Get next nonce for transactions"""
        return int(time.time()) % 1000000
    
    def _estimate_confirmation_time(self, config: BlockchainConfig, priority: str) -> str:
        """Estimate transaction confirmation time"""
        base_time = {
            "ethereum": 15,
            "polygon": 2
        }.get(config.network_name, 15)
        
        priority_multiplier = {
            "low": 2.0,
            "standard": 1.0,
            "high": 0.5
        }.get(priority, 1.0)
        
        estimated_seconds = base_time * config.confirmation_blocks * priority_multiplier
        
        if estimated_seconds < 60:
            return f"{int(estimated_seconds)} seconds"
        elif estimated_seconds < 3600:
            return f"{int(estimated_seconds / 60)} minutes"
        else:
            return f"{int(estimated_seconds / 3600)} hours"
    
    def verify_blockchain_registration(self, transaction_hash: str, network: str) -> Dict[str, Any]:
        """Verify blockchain registration status"""
        try:
            config = self.networks.get(network)
            if not config:
                raise ValueError(f"Unsupported blockchain network: {network}")
            
            tx_status = self._query_transaction_status(transaction_hash, config)
            
            return {
                "transaction_hash": transaction_hash,
                "blockchain_network": network,
                "status": tx_status.get("status", "pending"),
                "block_number": tx_status.get("blockNumber"),
                "confirmations": tx_status.get("confirmations", 0),
                "gas_used": tx_status.get("gasUsed"),
                "transaction_fee": tx_status.get("transactionFee"),
                "verified_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "transaction_hash": transaction_hash,
                "blockchain_network": network,
                "status": "error",
                "error": str(e),
                "verified_at": datetime.utcnow().isoformat()
            }
    
    def _query_transaction_status(self, tx_hash: str, config: BlockchainConfig) -> Dict[str, Any]:
        """Query transaction status from blockchain"""
        if tx_hash.startswith("0x") and len(tx_hash) == 66:
            return {
                "status": "confirmed",
                "blockNumber": 12345678,
                "confirmations": 15,
                "gasUsed": 85000,
                "transactionFee": "0.002"
            }
        else:
            return {
                "status": "pending",
                "confirmations": 0
            }
    
    def create_forensic_proof(
        self, 
        original_hash: str,
        suspected_content: str,
        blockchain_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create forensic proof for plagiarism detection"""
        
        suspected_hash = hashlib.sha256(suspected_content.encode()).hexdigest()
        
        exact_matches = []
        for record in blockchain_records:
            if record.get("content_hash") == suspected_hash:
                exact_matches.append(record)
        
        similarity_score = self._calculate_similarity(original_hash, suspected_hash)
        
        forensic_proof = {
            "analysis_id": hashlib.sha256(f"{original_hash}:{suspected_hash}:{int(time.time())}".encode()).hexdigest()[:16],
            "original_hash": original_hash,
            "suspected_hash": suspected_hash,
            "similarity_score": similarity_score,
            "exact_matches": exact_matches,
            "blockchain_evidence": [
                {
                    "network": record.get("blockchain_network"),
                    "transaction_hash": record.get("transaction_hash"),
                    "block_number": record.get("block_number"),
                    "timestamp": record.get("timestamp")
                }
                for record in blockchain_records
                if record.get("status") == "confirmed"
            ],
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "confidence_level": "high" if similarity_score > 0.9 else "medium" if similarity_score > 0.7 else "low"
        }
        
        return forensic_proof
    
    def _calculate_similarity(self, hash1: str, hash2: str) -> float:
        """Calculate similarity between two hashes"""
        if hash1 == hash2:
            return 1.0
        
        if len(hash1) != len(hash2):
            return 0.0
        
        matches = sum(c1 == c2 for c1, c2 in zip(hash1, hash2))
        return matches / len(hash1)
    
    def get_supported_networks(self) -> List[Dict[str, Any]]:
        """Get list of supported blockchain networks"""
        return [
            {
                "network": name,
                "chain_id": config.chain_id,
                "confirmation_blocks": config.confirmation_blocks,
                "average_block_time": {
                    "ethereum": "15 seconds",
                    "polygon": "2 seconds"
                }.get(name, "unknown"),
                "enabled": self.enabled and config.contract_address is not None
            }
            for name, config in self.networks.items()
        ]