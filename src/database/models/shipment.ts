import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from "typeorm";
import { BaseColumnSchema } from "./base";
import { OrderEntity } from "./order";

/**
 * Shipment Entity - Represents individual package shipments
 */
@Entity({ name: "shipments" })
@Index(["orderId"]) // Foreign key lookup for shipments by order
@Index(["shippedAt"]) // Temporal queries for shipment history
@Index(["orderId", "shippedAt"]) // Composite index for ordered shipment retrieval
export class ShipmentEntity extends BaseColumnSchema {
  @Column()
  orderId!: number;

  @ManyToOne(() => OrderEntity, { nullable: true })
  @JoinColumn({ name: "orderId", referencedColumnName: "orderId" })
  order?: OrderEntity;

  @Column({ type: "json" })
  shippedItems!: { productId: number; quantity: number }[];

  @Column({ type: "int" })
  totalMassG!: number;

  @CreateDateColumn()
  shippedAt!: Date;
}