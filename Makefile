# Legato Platform Makefile

.PHONY: help build up down logs clean health test

help: ## Show this help message
	@echo "Legato Platform Development Commands"
	@echo "===================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs -f

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health | python -m json.tool

clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f

test: ## Run basic connectivity tests
	@echo "Testing API Gateway..."
	@curl -s http://localhost:8000/ | python -m json.tool
	@echo "\nTesting service health..."
	@curl -s http://localhost:8000/health | python -m json.tool

dev-setup: ## Set up development environment
	@echo "Setting up Legato development environment..."
	make build
	make up
	@echo "Waiting for services to start..."
	@sleep 10
	make health

restart: ## Restart all services
	make down
	make up

# Individual service commands
auth-logs: ## Show auth service logs
	docker-compose logs -f auth-service

user-logs: ## Show user service logs
	docker-compose logs -f user-service

content-logs: ## Show content service logs
	docker-compose logs -f content-service

ip-logs: ## Show IP service logs
	docker-compose logs -f ip-service

payment-logs: ## Show payment service logs
	docker-compose logs -f payment-service

ai-logs: ## Show AI service logs
	docker-compose logs -f ai-service

analytics-logs: ## Show analytics service logs
	docker-compose logs -f analytics-service

gateway-logs: ## Show API gateway logs
	docker-compose logs -f api-gateway