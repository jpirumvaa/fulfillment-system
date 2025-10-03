# Medical Supply Fulfillment System

A complete order fulfillment system for medical supply inventory management and shipment processing. Built with Node.js, TypeScript, PostgreSQL, and Docker.

## Features

- **Inventory Management** - Product catalog initialization and stock tracking
- **Order Processing** - Queue-based order fulfillment with automatic retry
- **Shipment Optimization** - Weight-constrained package creation (1.8kg limit)
- **REST API** - Complete API with authentication and rate limiting
- **Database Management** - PostgreSQL with automated migrations
- **Docker Deployment** - Containerized application with Docker Compose
- **Testing Suite** - Unit and integration tests with Jest
- **Design Patterns** - Singleton, Strategy, and Facade patterns

## Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Yarn or npm
- Docker & Docker Compose (for containerized deployment)

## Installation

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/jpirumvaa/fulfillment-system.git
   cd fulfillment-system
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL database**

   ```bash
   # Using Docker (Update credentials to match your .env file)
   docker run --name zipline_db -e POSTGRES_PASSWORD=zipline_password -e POSTGRES_USER=zipline -e POSTGRES_DB=zipline -p 5433:5432 -d postgres:15-alpine
   ```

5. **Run database migrations**

   ```bash
   yarn migrate
   ```

6. **Start development server**
   ```bash
   yarn dev
   ```

### Docker Deployment

1. **Build and start with Docker Compose**

   ```bash
   docker compose up -d
   ```

2. **View logs**

   ```bash
   docker compose logs -f zipline_app
   ```

3. **Stop services**
   ```bash
   docker compose down
   ```

The Docker setup automatically runs database migrations before starting the application.

## API Testing

For comprehensive API testing instructions, endpoints, and example workflows, see:

**[API Testing Guide](./API_TESTING_GUIDE.md)**

The testing guide includes:

- Authentication setup
- Complete API reference with examples
- Test scenarios for all functionality
- Database management procedures

### Quick Start

1. Start the application: `docker compose up -d`
2. Follow the [API Testing Guide](./API_TESTING_GUIDE.md) for detailed testing instructions

### Interactive Documentation

Once running, access Swagger documentation at: `http://localhost:3000/api-docs`

## Database Schema

The system includes the following database tables:

- **users** - User accounts and authentication
- **products** - Product catalog with stock tracking
- **orders** - Order processing and status tracking
- **shipments** - Shipment details and tracking

Database migrations are automatically run on application startup in production environments.

## Testing

### Unit Tests

```bash
NODE_ENV=test yarn test                    # Run all tests
NODE_ENV=test yarn test --coverage        # Run with coverage
NODE_ENV=test yarn test ServiceName.test  # Run specific test
```

Tests use an in-memory SQLite database for isolation and require `NODE_ENV=test` for proper configuration.

### API Testing

See **[API Testing Guide](./API_TESTING_GUIDE.md)** for comprehensive API testing instructions and examples.

## Technical Debt

**Known Technical Debt**

This project has intentionally taken on technical debt to speed up initial development. The main issues are:

**Base Controller Pattern**:
- There's a base controller (`src/controllers/BaseController.ts`) with common CRUD operations
- Controllers should consistently extend the base controller to avoid code duplication

**Base Service Pattern**:
- There's a base service (`src/services/BaseService.ts`) with common CRUD operations and hooks
- Not all services extend this base service consistently
- Services should extend the base service to get common functionality automatically

**Why This Matters**: This debt should be paid as soon as possible before adding more features. Once fixed, adding new controllers and services will be much easier because you won't need to rewrite the same CRUD operations over and over.

**Action Needed**: 
1. Make all controllers extend the base controller consistently  
2. Make all services extend the base service consistently
3. Ensure the inheritance patterns work correctly

## Architecture

### Design Patterns

1. **Singleton Pattern** - Services maintain single instances

   - `InventoryService`
   - `OrderQueueService`
   - `FulfillmentService`

2. **Strategy Pattern** - Flexible shipment packing algorithms

   - `GreedyFirstFitStrategy`
   - `WeightBalancedStrategy`
   - `ShipmentStrategyContext`

3. **Template Method Pattern** - Abstract Service and Controller base classes

   - BaseService: Extensible hooks for validation and transformation
   - BaseController: Common CRUD operations for all controllers
   - Consistent error handling

4. **Facade Pattern** - FulfillmentService simplifies complex operations
   - Coordinates inventory, orders, and shipments

### Project Structure

```
src/
├── config/           # Configuration files
│   ├── constants.ts
│   ├── database.ts
│   └── swagger.ts
├── controllers/      # HTTP request handlers
│   ├── Auth.ts
│   ├── BaseController.ts
│   ├── Fulfillment.ts
│   └── User.ts
├── database/         # Database models and migrations
│   ├── migrations/   # TypeORM migration files
│   └── models/       # Entity definitions
│       ├── base/     # Base entity schema
│       ├── product.ts
│       ├── order.ts
│       ├── shipment.ts
│       └── user.ts
├── middleware/       # Express middleware
│   └── auth.ts
├── routes/          # API routes
│   ├── auth.ts
│   ├── fulfillment.ts
│   └── user.ts
├── services/        # Business logic
│   ├── BaseService.ts         # Abstract base class
│   ├── InventoryService.ts
│   ├── OrderQueueService.ts
│   ├── ShipmentStrategy.ts
│   └── FulfillmentService.ts
├── utils/           # Utility functions
├── app.ts          # Express app setup
└── index.ts        # Application entry point
```

## Configuration

### Environment Variables

| Variable           | Description                          | Default          |
| ------------------ | ------------------------------------ | ---------------- |
| `NODE_ENV`         | Environment (development/production) | development      |
| `PORT`             | Application port                     | 3000             |
| `DB_HOST_PROD`     | Production database host             | postgres         |
| `DB_PORT_PROD`     | Production database port             | 5432             |
| `DB_USER_PROD`     | Production database user             | zipline          |
| `DB_PASSWORD_PROD` | Production database password         | zipline_password |
| `DB_NAME_PROD`     | Production database name             | zipline          |
| `JWT_SECRET`       | JWT secret key                       | (required)       |
| `JWT_EXPIRES_IN`   | JWT expiration time                  | 24h              |
| `RATEMAXCOUNT`     | Rate limit per minute                | 20               |

## Available Scripts

| Script              | Description                                   |
| ------------------- | --------------------------------------------- |
| `yarn dev`          | Start development server with hot reload      |
| `yarn build`        | Build production bundle                       |
| `yarn start`        | Start production server (includes migrations) |
| `yarn test`         | Run tests                                     |
| `yarn lint`         | Run ESLint                                    |
| `yarn migrate`      | Run database migrations (development)         |
| `yarn migrate:prod` | Run database migrations (production)          |

## Docker Commands

```bash
# Build image
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f zipline_app

# Stop services
docker compose down

# Remove volumes (reset database)
docker compose down -v

# Rebuild and start
docker compose up -d --build
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Password hashing with bcrypt
- Input validation
- SQL injection protection (TypeORM)

## Performance

- In-memory catalog caching
- Efficient bin packing algorithms
- Database indexing
- Connection pooling
- Request rate limiting

## System Overview

### Core Functionality

- **Inventory Management**: Initialize product catalog and track stock levels
- **Order Processing**: Process incoming orders and create shipments when inventory is available
- **Restock Management**: Add inventory and automatically fulfill pending orders
- **Weight Optimization**: Automatically split shipments to respect 1.8kg weight limits
- **Order Queue**: Hold pending orders when inventory is insufficient

### Architecture

- **Singleton Services**: Centralized service instances for inventory, orders, and fulfillment
- **Strategy Pattern**: Pluggable shipment packing algorithms (Greedy First-Fit implemented)
- **Facade Pattern**: FulfillmentService coordinates between inventory, orders, and shipments
- **TypeORM**: Database abstraction with entity relationships and migrations

### Technology Stack

- **Backend**: Node.js with TypeScript and Express
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest with SQLite in-memory database
- **Deployment**: Docker and Docker Compose
