import { Repository } from "typeorm";
import { Service } from "./BaseService";
import { ShipmentEntity, OrderEntity } from "../database/models";
import { InventoryService } from "./InventoryService";
import { OrderQueueService } from "./OrderQueueService";
import {
  ShipmentStrategyContext,
  GreedyFirstFitStrategy,
} from "./ShipmentStrategy";
import db from "../database";

/**
 * FulfillmentService - Main orchestrator implementing Facade pattern
 * 
 * Architecture:
 * - Facade Pattern: Simplifies complex subsystem interactions (inventory, orders, shipments)
 * - Singleton Pattern: Ensures single instance for coordinated state management
 * - Strategy Pattern: Pluggable shipment packing algorithms
 * 
 * Performance Features:
 * - Batch processing for high-volume orders (>100 shipments)
 * - Weight-based shipment optimization
 * - Automatic pending order fulfillment on restock
 */
export class FulfillmentService extends Service<ShipmentEntity> {
  private static instance: FulfillmentService;
  private inventoryService: InventoryService;
  private orderQueueService: OrderQueueService;
  private shipmentStrategy: ShipmentStrategyContext;
  private readonly MAX_PACKAGE_WEIGHT_G = 1800; // 1.8kg

  private constructor() {
    const shipmentRepository = db.getRepository(ShipmentEntity);
    super("FulfillmentService", shipmentRepository);

    this.inventoryService = InventoryService.getInstance();
    this.orderQueueService = OrderQueueService.getInstance();

    // Initialize with greedy first-fit strategy
    this.shipmentStrategy = new ShipmentStrategyContext(
      new GreedyFirstFitStrategy(this.inventoryService)
    );
  }

  /**
   * Singleton getInstance method
   */
  public static getInstance(): FulfillmentService {
    if (!FulfillmentService.instance) {
      FulfillmentService.instance = new FulfillmentService();
    }
    return FulfillmentService.instance;
  }

  /**
   * Initialize catalog - delegates to InventoryService
   */
  public async initCatalog(
    productInfo: { product_id: number; product_name: string; mass_g: number }[]
  ): Promise<void> {
    this.logInfo("Initializing catalog");
    await this.inventoryService.initCatalog(productInfo);
  }

  /**
   * Process incoming order
   * Attempts immediate fulfillment or queues for later
   */
  public async processOrder(order: {
    order_id: number;
    requested: { product_id: number; quantity: number }[];
  }): Promise<void> {
    try {
      this.logInfo(`Processing order ${order.order_id}`);

      // Enqueue the order
      const orderEntity = await this.orderQueueService.enqueueOrder(
        order.order_id,
        order.requested
      );

      // Attempt to fulfill immediately
      await this.attemptFulfillment(orderEntity);
    } catch (error) {
      this.logError(`Error processing order ${order.order_id}`, error);
      throw error;
    }
  }

  /**
   * Process restock and attempt fulfillment of pending orders
   */
  public async processRestock(
    restock: { product_id: number; quantity: number }[]
  ): Promise<void> {
    try {
      this.logInfo("Processing restock");

      // Update inventory
      await this.inventoryService.processRestock(restock);

      // Attempt to fulfill pending orders
      await this.fulfillPendingOrders();
    } catch (error) {
      this.logError("Error processing restock", error);
      throw error;
    }
  }

  /**
   * Attempt to fulfill a specific order
   */
  private async attemptFulfillment(order: OrderEntity): Promise<void> {
    try {
      const remainingItems = this.orderQueueService.getRemainingItems(order);

      if (remainingItems.length === 0) {
        this.logInfo(`Order ${order.orderId} is already fulfilled`);
        return;
      }

      // Determine what can be shipped based on current inventory
      const shippableItems = this.getShippableItems(remainingItems);

      if (shippableItems.length === 0) {
        this.logInfo(
          `Order ${order.orderId} cannot be fulfilled - insufficient inventory`
        );
        return;
      }

      // Pack items into shipments respecting weight limit
      const shipments = this.shipmentStrategy.packShipment(
        shippableItems,
        this.MAX_PACKAGE_WEIGHT_G
      );

      // Optimize for large quantities - batch process shipments
      if (shipments.length > 100) {
        this.logInfo(`Processing ${shipments.length} shipments in batch mode for order ${order.orderId}`);
        await this.batchShipPackages(order.orderId, shipments);
      } else {
        // Create and ship each package individually for smaller orders
        for (const shipmentItems of shipments) {
          await this.shipPackage(order.orderId, shipmentItems);
        }
      }
    } catch (error) {
      this.logError(`Error attempting fulfillment for order ${order.orderId}`, error);
      throw error;
    }
  }

  /**
   * Attempt to fulfill all pending orders
   */
  private async fulfillPendingOrders(): Promise<void> {
    try {
      const pendingOrders = await this.orderQueueService.getPendingOrders();

      this.logInfo(`Attempting to fulfill ${pendingOrders.length} pending orders`);

      for (const order of pendingOrders) {
        await this.attemptFulfillment(order);
      }
    } catch (error) {
      this.logError("Error fulfilling pending orders", error);
      throw error;
    }
  }

  /**
   * Determine which items can be shipped based on inventory
   */
  private getShippableItems(
    requestedItems: { productId: number; quantity: number }[]
  ): { productId: number; quantity: number }[] {
    const shippableItems: { productId: number; quantity: number }[] = [];

    for (const item of requestedItems) {
      const availableStock = this.inventoryService.getAvailableStock(
        item.productId
      );
      const shippableQuantity = Math.min(item.quantity, availableStock);

      if (shippableQuantity > 0) {
        shippableItems.push({
          productId: item.productId,
          quantity: shippableQuantity,
        });
      }
    }

    return shippableItems;
  }

  /**
   * Batch process multiple shipments for performance optimization
   * Used for orders with many shipments (>100)
   */
  private async batchShipPackages(
    orderId: number,
    allShipments: { productId: number; quantity: number }[][]
  ): Promise<void> {
    try {
      // Batch size for processing
      const BATCH_SIZE = 50;
      const totalShipments = allShipments.length;
      
      this.logInfo(`Starting batch shipment processing: ${totalShipments} shipments in batches of ${BATCH_SIZE}`);

      // Process shipments in batches
      for (let i = 0; i < totalShipments; i += BATCH_SIZE) {
        const batch = allShipments.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalShipments / BATCH_SIZE);
        
        this.logInfo(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} shipments)`);

        // Collect all items from this batch for inventory reservation
        const allBatchItems: { productId: number; quantity: number }[] = [];
        const shipmentData: any[] = [];
        let totalMass = 0;

        for (const shipmentItems of batch) {
          // Calculate mass for this shipment
          const shipmentMass = this.inventoryService.calculateTotalMass(shipmentItems);
          
          // Validate weight constraint
          if (shipmentMass > this.MAX_PACKAGE_WEIGHT_G) {
            this.logError(`Shipment exceeds maximum weight: ${shipmentMass}g > ${this.MAX_PACKAGE_WEIGHT_G}g`);
            continue;
          }

          // Add to batch items for inventory reservation
          for (const item of shipmentItems) {
            const existingItem = allBatchItems.find(bi => bi.productId === item.productId);
            if (existingItem) {
              existingItem.quantity += item.quantity;
            } else {
              allBatchItems.push({ ...item });
            }
          }

          // Prepare shipment data
          shipmentData.push({
            orderId,
            shippedItems: shipmentItems,
            totalMassG: shipmentMass,
            shippedAt: new Date(),
          });
          
          totalMass += shipmentMass;
        }

        // Reserve inventory for entire batch
        if (allBatchItems.length > 0) {
          await this.inventoryService.reserveStock(allBatchItems);
        }

        // Insert all shipments in batch
        if (shipmentData.length > 0) {
          await this.repository.insert(shipmentData);
        }

        // Update order with all batch items
        if (allBatchItems.length > 0) {
          await this.orderQueueService.updateOrderShipment(orderId, allBatchItems);
        }

        // Log batch progress
        this.logInfo(`Batch ${batchNumber} completed: ${shipmentData.length} shipments, ${totalMass}g total`);

        // Log batch shipment summary instead of individual shipments for performance
        this.logInfo(`Batch ${batchNumber} shipments: ${shipmentData.length} packages for order ${orderId}`);
      }

      this.logInfo(`Batch processing completed for order ${orderId}: ${totalShipments} shipments processed`);
    } catch (error) {
      this.logError(`Error in batch shipment processing for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Ship a package - creates shipment record and updates order
   */
  private async shipPackage(
    orderId: number,
    items: { productId: number; quantity: number }[]
  ): Promise<void> {
    try {
      // Calculate total mass
      const totalMass = this.inventoryService.calculateTotalMass(items);

      // Validate weight constraint
      if (totalMass > this.MAX_PACKAGE_WEIGHT_G) {
        throw new Error(
          `Shipment exceeds maximum weight: ${totalMass}g > ${this.MAX_PACKAGE_WEIGHT_G}g`
        );
      }

      // Reserve inventory
      await this.inventoryService.reserveStock(items);

      // Create shipment record
      const shipmentData = {
        orderId,
        shippedItems: items,
        totalMassG: totalMass,
        shippedAt: new Date(),
      };
      await this.repository.insert(shipmentData);

      // Update order
      await this.orderQueueService.updateOrderShipment(orderId, items);

      // Call ship_package API (stub - just logs to console)
      this.shipPackageStub(orderId, items);

      this.logInfo(
        `Shipped package for order ${orderId}: ${items.length} item types, ${totalMass}g`
      );
    } catch (error) {
      this.logError(`Error shipping package for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Ship package stub - logs shipment details
   * In production, this would call an external API
   */
  private shipPackageStub(
    orderId: number,
    items: { productId: number; quantity: number }[]
  ): void {
    const shipment = {
      order_id: orderId,
      shipped: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    };

    this.logInfo(`SHIP PACKAGE - Order ${orderId}: ${JSON.stringify(shipment.shipped)}`);
  }

  /**
   * Get fulfillment status for an order
   */
  public async getOrderStatus(orderId: number): Promise<{
    order: OrderEntity | null;
    remainingItems: { productId: number; quantity: number }[];
    shipments: ShipmentEntity[];
  }> {
    try {
      const order = await this.orderQueueService.getOrder(orderId);

      if (!order) {
        return {
          order: null,
          remainingItems: [],
          shipments: [],
        };
      }

      const remainingItems = this.orderQueueService.getRemainingItems(order);
      const shipments = await this.repository.find({ where: { orderId } });

      return {
        order,
        remainingItems,
        shipments,
      };
    } catch (error) {
      this.logError(`Error getting order status for ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Get all shipments for an order
   */
  public async getOrderShipments(orderId: number): Promise<ShipmentEntity[]> {
    try {
      return await this.repository.find({
        where: { orderId },
        order: { shippedAt: "ASC" },
      });
    } catch (error) {
      this.logError(`Error getting shipments for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  public async getAllOrders(): Promise<OrderEntity[]> {
    try {
      return await this.orderQueueService.getAllOrders();
    } catch (error) {
      this.logError("Error getting all orders", error);
      throw error;
    }
  }

  /**
   * Get pending orders in the queue
   */
  public async getOrderQueue(): Promise<{
    pendingOrders: OrderEntity[];
    pendingCount: number;
  }> {
    try {
      const pendingOrders = await this.orderQueueService.getPendingOrders();
      const pendingCount = this.orderQueueService.getPendingOrderCount();
      
      return {
        pendingOrders,
        pendingCount
      };
    } catch (error) {
      this.logError("Error getting order queue", error);
      throw error;
    }
  }

  /**
   * Reset catalog initialization state
   */
  public async resetCatalog(): Promise<void> {
    try {
      this.inventoryService.resetCatalog();
      this.logInfo("Catalog reset successfully");
    } catch (error) {
      this.logError("Error resetting catalog", error);
      throw error;
    }
  }

  /**
   * Get current stock levels for all products
   */
  public getAllStock(): { productId: number; productName: string; quantityInStock: number; massG: number }[] {
    try {
      return this.inventoryService.getAllStock();
    } catch (error) {
      this.logError("Error getting stock levels", error);
      throw error;
    }
  }

  /**
   * Get stock level for a specific product
   */
  public getProductStock(productId: number): { productId: number; productName: string; quantityInStock: number; massG: number } | null {
    try {
      return this.inventoryService.getProductStock(productId);
    } catch (error) {
      this.logError(`Error getting stock for product ${productId}`, error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  public async getSystemStatus(): Promise<{
    catalogInitialized: boolean;
    totalProducts: number;
    pendingOrders: number;
    totalShipments: number;
  }> {
    try {
      const products = this.inventoryService.getAllProducts();
      const pendingOrderCount =
        this.orderQueueService.getPendingOrderCount();
      const totalShipments = await this.repository.count();

      return {
        catalogInitialized: this.inventoryService.isCatalogInitialized(),
        totalProducts: products.length,
        pendingOrders: pendingOrderCount,
        totalShipments,
      };
    } catch (error) {
      this.logError("Error getting system status", error);
      throw error;
    }
  }
}