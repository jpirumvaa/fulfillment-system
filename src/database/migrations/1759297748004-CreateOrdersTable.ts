import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Migration: Create orders table for order management and tracking
 * 
 * Features:
 * - Integer auto-increment primary key with unique orderId for external references
 * - JSONB columns for flexible item storage with PostgreSQL optimization
 * - Order status enum for lifecycle management
 * - Shipment tracking counter
 * 
 * Performance Indexes:
 * - orderId: Primary lookup for order operations
 * - status: Status-based queries for pending orders
 * - status + createdAt: Composite index for FIFO pending order processing
 */
export class CreateOrdersTable1759297748004 implements MigrationInterface {
    name = 'CreateOrdersTable1759297748004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for order status
        await queryRunner.query(`
            CREATE TYPE "order_status_enum" AS ENUM(
                'pending',
                'partially_fulfilled', 
                'fulfilled'
            )
        `);

        await queryRunner.createTable(new Table({
            name: "orders",
            columns: [
                {
                    name: "id",
                    type: "integer",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "orderId",
                    type: "int",
                    isUnique: true
                },
                {
                    name: "requestedItems",
                    type: "jsonb"
                },
                {
                    name: "shippedItems",
                    type: "jsonb",
                    default: "'[]'"
                },
                {
                    name: "status",
                    type: "order_status_enum",
                    default: "'pending'"
                },
                {
                    name: "totalShipments",
                    type: "int",
                    default: 0
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "createdBy",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "updatedBy",
                    type: "int",
                    isNullable: true
                }
            ],
            indices: [
                {
                    name: "IDX_order_orderId",
                    columnNames: ["orderId"]
                },
                {
                    name: "IDX_order_status",
                    columnNames: ["status"]
                },
                {
                    name: "IDX_order_status_createdAt",
                    columnNames: ["status", "createdAt"]
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("orders");
        await queryRunner.query(`DROP TYPE "order_status_enum"`);
    }
}