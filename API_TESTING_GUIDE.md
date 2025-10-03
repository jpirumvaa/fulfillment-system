# API Testing Guide

## Quick Start

1. **Start the application**: `docker compose up -d`
2. **Register a user** to get authentication token
3. **Initialize catalog** before processing orders
4. **Test order processing** with various scenarios

## Authentication

All fulfillment endpoints require JWT authentication.

### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**Save the JWT token from the response for all subsequent requests.**

## Core Workflow

### 1. Initialize Catalog
```bash
POST /api/v1/fulfillment/init-catalog
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

[
  {"product_id": 0, "product_name": "RBC A+ Adult", "mass_g": 700},
  {"product_id": 1, "product_name": "RBC O- Pediatric", "mass_g": 350},
  {"product_id": 2, "product_name": "Platelets A+", "mass_g": 200}
]
```

### 2. Process Order
```bash
POST /api/v1/fulfillment/process-order
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "order_id": 123,
  "requested": [
    {"product_id": 0, "quantity": 2},
    {"product_id": 1, "quantity": 1}
  ]
}
```

### 3. Add Inventory
```bash
POST /api/v1/fulfillment/process-restock
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

[
  {"product_id": 0, "quantity": 50},
  {"product_id": 1, "quantity": 30}
]
```

### 4. Check Order Status
```bash
GET /api/v1/fulfillment/order/123/status
Authorization: Bearer <your-jwt-token>
```

### 5. View Shipments
```bash
GET /api/v1/fulfillment/order/123/shipments
Authorization: Bearer <your-jwt-token>
```

## Test Scenarios

### Scenario 1: Basic Order Fulfillment
1. Initialize catalog with products
2. Add inventory via restock
3. Process an order
4. Verify shipments were created

### Scenario 2: Insufficient Inventory
1. Process an order without sufficient inventory
2. Verify order is queued as pending
3. Add inventory via restock
4. Verify order is automatically fulfilled

### Scenario 3: Weight Constraints
1. Create an order that exceeds 1.8kg per package
2. Verify system splits into multiple shipments
3. Check that each shipment respects weight limit

### Scenario 4: Large Volume Processing
Test with larger quantities to verify performance optimizations:
```json
{
  "order_id": 999,
  "requested": [
    {"product_id": 0, "quantity": 1000}
  ]
}
```

## Management Endpoints

### System Status
```bash
GET /api/v1/fulfillment/status
Authorization: Bearer <your-jwt-token>
```

### All Orders
```bash
GET /api/v1/fulfillment/orders
Authorization: Bearer <your-jwt-token>
```

### Order Queue
```bash
GET /api/v1/fulfillment/queue
Authorization: Bearer <your-jwt-token>
```

### Stock Levels
```bash
GET /api/v1/fulfillment/stock
Authorization: Bearer <your-jwt-token>
```

### Reset Catalog
```bash
POST /api/v1/fulfillment/reset-catalog
Authorization: Bearer <your-jwt-token>
```

## Database Management

### Reset Database (Development)
```bash
# Stop application
docker compose down

# Reset database
docker exec zipline_db psql -U zipline -d zipline -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restart with migrations
docker compose up -d
```

## Expected Behaviors

- **Empty Inventory**: Orders queue as pending until inventory is available
- **Weight Limits**: Orders exceeding 1.8kg are split into multiple shipments
- **Automatic Fulfillment**: Restocking triggers fulfillment of pending orders
- **Authentication**: All endpoints require valid JWT tokens
- **Idempotent Operations**: Safe to retry catalog initialization and restocking

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```