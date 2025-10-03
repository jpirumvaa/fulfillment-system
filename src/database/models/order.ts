import { Entity, Column, Index } from "typeorm";
import { BaseColumnSchema } from "./base";

export enum OrderStatus {
  PENDING = "pending",
  PARTIALLY_FULFILLED = "partially_fulfilled",
  FULFILLED = "fulfilled",
}

/**
 * Order Entity - Represents customer orders with fulfillment tracking
 */
@Entity({ name: "orders" })
@Index(["orderId"]) // Primary lookup index
@Index(["status"]) // Status-based queries for pending orders
@Index(["status", "createdAt"]) // Composite index for FIFO pending order queries
export class OrderEntity extends BaseColumnSchema {
  @Column({ unique: true })
  orderId!: number;

  @Column({ type: "json" })
  requestedItems!: { productId: number; quantity: number }[];

  @Column({ type: "json", default: '[]' })
  shippedItems!: { productId: number; quantity: number }[];

  @Column({
    type: "varchar",
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: "int", default: 0 })
  totalShipments!: number;
}