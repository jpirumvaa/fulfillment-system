import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Migration: Create products table for medical supply inventory
 * 
 * Features:
 * - Integer auto-increment primary key with unique productId for external references
 * - Performance indexes on frequently queried fields
 * - Mass tracking in grams for shipping calculations
 * - Real-time stock quantity tracking
 * 
 * Performance Indexes:
 * - productId: Primary lookup for order processing
 * - quantityInStock: Inventory availability queries
 */
export class CreateProductsTable1759297748003 implements MigrationInterface {
    name = 'CreateProductsTable1759297748003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "products",
            columns: [
                {
                    name: "id",
                    type: "integer",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "productId",
                    type: "int",
                    isUnique: true
                },
                {
                    name: "productName",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "massG",
                    type: "int"
                },
                {
                    name: "quantityInStock",
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
                    name: "IDX_product_productId",
                    columnNames: ["productId"]
                },
                {
                    name: "IDX_product_quantityInStock",
                    columnNames: ["quantityInStock"]
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("products");
    }
}