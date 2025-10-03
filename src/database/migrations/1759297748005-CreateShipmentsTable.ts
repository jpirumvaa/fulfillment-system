import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

/**
 * Migration: Create shipments table for package tracking and fulfillment
 * 
 * Features:
 * - UUID primary key
 * - Foreign key relationship to orders table
 * - JSONB for flexible shipped items storage
 * - Mass tracking for weight compliance (1.8kg limit)
 * - Shipment timestamp for delivery tracking
 * 
 * Performance Indexes:
 * - orderId: Foreign key lookup for shipments by order
 * - shippedAt: Temporal queries for shipment history
 * - orderId + shippedAt: Composite index for ordered shipment retrieval
 * 
 * Foreign Keys:
 * - orderId references orders(orderId) with CASCADE delete
 */
export class CreateShipmentsTable1759297748005 implements MigrationInterface {
    name = 'CreateShipmentsTable1759297748005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "shipments",
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
                    type: "int"
                },
                {
                    name: "shippedItems",
                    type: "jsonb"
                },
                {
                    name: "totalMassG",
                    type: "int"
                },
                {
                    name: "shippedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
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
                    name: "IDX_shipment_orderId",
                    columnNames: ["orderId"]
                },
                {
                    name: "IDX_shipment_shippedAt",
                    columnNames: ["shippedAt"]
                },
                {
                    name: "IDX_shipment_orderId_shippedAt",
                    columnNames: ["orderId", "shippedAt"]
                }
            ]
        }), true);

        // Add foreign key constraint
        await queryRunner.createForeignKey("shipments", new TableForeignKey({
            columnNames: ["orderId"],
            referencedColumnNames: ["orderId"],
            referencedTableName: "orders",
            onDelete: "CASCADE",
            name: "FK_shipment_order"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("shipments", "FK_shipment_order");
        await queryRunner.dropTable("shipments");
    }
}