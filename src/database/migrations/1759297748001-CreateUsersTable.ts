import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Migration: Create users table with authentication support
 * 
 * Features:
 * - UUID primary key
 * - Unique email constraint
 * - Email index for fast authentication lookups
 * - Timestamps for audit trail
 */
export class CreateUsersTable1759297748001 implements MigrationInterface {
    name = 'CreateUsersTable1759297748001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                {
                    name: "id",
                    type: "integer",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "firstName",
                    type: "varchar",
                    length: "100"
                },
                {
                    name: "lastName",
                    type: "varchar",
                    length: "100"
                },
                {
                    name: "email",
                    type: "varchar",
                    length: "255",
                    isUnique: true
                },
                {
                    name: "password",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "phoneNumber",
                    type: "varchar",
                    length: "20",
                    isUnique: true
                },
                {
                    name: "otp",
                    type: "varchar",
                    length: "10",
                    isNullable: true
                },
                {
                    name: "lastLoginTime",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "deletedAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
                    default: "'INACTIVE'"
                },
                {
                    name: "profilePicture",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "companyId",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "national_id",
                    type: "varchar",
                    length: "50",
                    isNullable: true
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
                    name: "IDX_user_email",
                    columnNames: ["email"]
                },
                {
                    name: "IDX_user_phoneNumber",
                    columnNames: ["phoneNumber"]
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}