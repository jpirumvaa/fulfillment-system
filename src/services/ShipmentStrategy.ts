import { InventoryService } from "./InventoryService";
import { Logger } from "../utils/logger";

/**
 * Strategy interface for shipment packing algorithms
 * Implements Strategy Pattern for flexible shipment packaging
 */
export interface IShipmentStrategy {
  packShipment(
    items: { productId: number; quantity: number }[],
    maxWeightG: number
  ): { productId: number; quantity: number }[][];
}

/**
 * Greedy First-Fit Strategy - Packs items greedily into shipments
 * Uses First-Fit Decreasing algorithm for bin packing optimization
 */
export class GreedyFirstFitStrategy implements IShipmentStrategy {
  private logger: Logger;

  constructor(private inventoryService: InventoryService) {
    this.logger = Logger.instance;
  }

  /**
   * Pack items into multiple shipments respecting weight limit
   * Optimized for large quantities with improved algorithms
   */
  public packShipment(
    items: { productId: number; quantity: number }[],
    maxWeightG: number
  ): { productId: number; quantity: number }[][] {
    const shipments: { productId: number; quantity: number }[][] = [];

    // Pre-calculate product weights and sort by weight (heaviest first)
    const itemsWithWeight = items.map((item) => {
      const product = this.inventoryService.getProduct(item.productId);
      return {
        ...item,
        unitWeight: product ? product.massG : 0,
        product: product
      };
    }).filter(item => item.product && item.quantity > 0)
      .sort((a, b) => b.unitWeight - a.unitWeight); // Sort heaviest first

    // Process items efficiently
    for (const item of itemsWithWeight) {
      let remainingQuantity = item.quantity;
      
      while (remainingQuantity > 0) {
        // Calculate max units per shipment for this product
        const maxUnitsPerShipment = Math.floor(maxWeightG / item.unitWeight);
        
        if (maxUnitsPerShipment === 0) {
          // Item too heavy for any shipment - skip
          this.logWarning(`Product ${item.productId} too heavy (${item.unitWeight}g) for shipment limit (${maxWeightG}g)`);
          break;
        }

        // Try to add to existing shipment first
        let added = false;
        for (const shipment of shipments) {
          const currentWeight = this.calculateShipmentWeight(shipment);
          const availableWeight = maxWeightG - currentWeight;
          const maxAddableUnits = Math.floor(availableWeight / item.unitWeight);
          const unitsToAdd = Math.min(maxAddableUnits, remainingQuantity);

          if (unitsToAdd > 0) {
            // Check if this product already exists in shipment
            const existingItem = shipment.find(s => s.productId === item.productId);
            if (existingItem) {
              existingItem.quantity += unitsToAdd;
            } else {
              shipment.push({
                productId: item.productId,
                quantity: unitsToAdd
              });
            }
            remainingQuantity -= unitsToAdd;
            added = true;
            break;
          }
        }

        // If couldn't add to existing shipment, create new one
        if (!added) {
          const unitsForNewShipment = Math.min(maxUnitsPerShipment, remainingQuantity);
          shipments.push([{
            productId: item.productId,
            quantity: unitsForNewShipment
          }]);
          remainingQuantity -= unitsForNewShipment;
        }
      }
    }

    return shipments;
  }

  /**
   * Calculate total weight of a shipment
   */
  private calculateShipmentWeight(shipment: { productId: number; quantity: number }[]): number {
    return shipment.reduce((total, item) => {
      const product = this.inventoryService.getProduct(item.productId);
      return total + (product ? product.massG * item.quantity : 0);
    }, 0);
  }

  /**
   * Log warning for shipment strategy
   */
  private logWarning(message: string): void {
    this.logger.warn(`[ShipmentStrategy] ${message}`);
  }
}

/**
 * Weight-Balanced Strategy - Tries to balance weight across shipments
 * Useful for optimizing delivery logistics
 */
export class WeightBalancedStrategy implements IShipmentStrategy {
  private logger: Logger;

  constructor(private inventoryService: InventoryService) {
    this.logger = Logger.instance;
  }

  public packShipment(
    items: { productId: number; quantity: number }[],
    maxWeightG: number
  ): { productId: number; quantity: number }[][] {
    const shipments: { productId: number; quantity: number }[][] = [];

    // Calculate total weight needed
    let totalWeight = 0;
    for (const item of items) {
      const product = this.inventoryService.getProduct(item.productId);
      if (product) {
        totalWeight += product.massG * item.quantity;
      }
    }

    // Estimate number of shipments needed
    const estimatedShipments = Math.ceil(totalWeight / maxWeightG);
    const targetWeightPerShipment = totalWeight / estimatedShipments;

    // Create a working copy
    const remainingItems = items.map((item) => ({ ...item }));

    for (let i = 0; i < estimatedShipments; i++) {
      const currentShipment: { productId: number; quantity: number }[] = [];
      let currentWeight = 0;

      // Fill shipment targeting balanced weight
      for (const item of remainingItems) {
        if (item.quantity === 0) continue;

        const product = this.inventoryService.getProduct(item.productId);
        if (!product) continue;

        const itemWeight = product.massG;

        // Try to get close to target weight but don't exceed max
        const remainingCapacity = Math.min(
          maxWeightG - currentWeight,
          targetWeightPerShipment - currentWeight
        );

        const maxUnits = Math.floor(remainingCapacity / itemWeight);
        const unitsToAdd = Math.min(maxUnits, item.quantity);

        if (unitsToAdd > 0) {
          currentShipment.push({
            productId: item.productId,
            quantity: unitsToAdd,
          });
          currentWeight += unitsToAdd * itemWeight;
          item.quantity -= unitsToAdd;
        }
      }

      if (currentShipment.length > 0) {
        shipments.push(currentShipment);
      }

      // Check if all items are packed
      if (remainingItems.every((item) => item.quantity === 0)) {
        break;
      }
    }

    return shipments;
  }
}

/**
 * Context class for shipment strategy
 * Allows switching between different packing strategies at runtime
 */
export class ShipmentStrategyContext {
  private strategy: IShipmentStrategy;

  constructor(strategy: IShipmentStrategy) {
    this.strategy = strategy;
  }

  /**
   * Set a different strategy at runtime
   */
  public setStrategy(strategy: IShipmentStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Execute the current strategy
   */
  public packShipment(
    items: { productId: number; quantity: number }[],
    maxWeightG: number
  ): { productId: number; quantity: number }[][] {
    return this.strategy.packShipment(items, maxWeightG);
  }
}