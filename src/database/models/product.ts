import { Entity, Column, Index } from "typeorm";
import { BaseColumnSchema } from "./base";

/**
 * Product Entity - Represents medical supply products in the catalog
 */
@Entity({ name: "products" })
@Index(["productId"]) // Primary lookup index
@Index(["quantityInStock"]) // Inventory availability queries
export class ProductEntity extends BaseColumnSchema {
  @Column({ unique: true })
  productId!: number;

  @Column()
  productName!: string;

  @Column({ type: "int" })
  massG!: number;

  @Column({ type: "int", default: 0 })
  quantityInStock!: number;
}