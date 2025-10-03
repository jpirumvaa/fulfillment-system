import { Repository } from "typeorm";
import { Service } from "./Service";
import { OrderEntity, OrderStatus } from "../database/models";
import db from "../database";

/**
 * OrderQueueService - Implements Queue pattern for managing pending orders
 * Maintains FIFO order processing with priority handling
 */
export class OrderQueueService extends Service<OrderEntity> {
  private static instance: OrderQueueService;
  private pendingOrders: Map<number, OrderEntity> = new Map();

  private constructor() {
    const orderRepository = db.getRepository(OrderEntity);
    super("OrderQueueService", orderRepository);
  }

  /**
   * Singleton getInstance method
   */
  public static getInstance(): OrderQueueService {
    if (!OrderQueueService.instance) {
      OrderQueueService.instance = new OrderQueueService();
    }
    return OrderQueueService.instance;
  }

  /**
   * Enqueue a new order
   */
  public async enqueueOrder(
    orderId: number,
    requestedItems: { product_id: number; quantity: number }[]
  ): Promise<OrderEntity> {
    try {
      this.logInfo(`Enqueueing order ${orderId}`);

      // Check if order already exists
      let order = await this.repository.findOne({ where: { orderId } });

      if (order) {
        this.logInfo(`Order ${orderId} already exists, updating...`);
        order.requestedItems = requestedItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        }));
        order.status = OrderStatus.PENDING;
      } else {
        // Create new order
        order = this.repository.create({
          orderId,
          requestedItems: requestedItems.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
          shippedItems: [],
          status: OrderStatus.PENDING,
          totalShipments: 0,
        });
      }

      order = await this.repository.save(order);
      this.pendingOrders.set(orderId, order);

      this.logInfo(`Order ${orderId} enqueued successfully`);
      return order;
    } catch (error) {
      this.logError(`Error enqueueing order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Get all pending orders that need fulfillment
   */
  public async getPendingOrders(): Promise<OrderEntity[]> {
    try {
      const orders = await this.repository.find({
        where: [
          { status: OrderStatus.PENDING },
          { status: OrderStatus.PARTIALLY_FULFILLED },
        ],
        order: { createdAt: "ASC" }, // FIFO ordering
      });

      // Update local cache
      this.pendingOrders.clear();
      orders.forEach((order) => this.pendingOrders.set(order.orderId, order));

      return orders;
    } catch (error) {
      this.logError("Error getting pending orders", error);
      throw error;
    }
  }

  /**
   * Get a specific order by ID
   */
  public async getOrder(orderId: number): Promise<OrderEntity | null> {
    try {
      // Always query database to get fresh data
      const order = await this.repository.findOne({ where: { orderId } });
      
      if (order) {
        // Update cache with fresh data
        if (order.status === OrderStatus.FULFILLED) {
          // Remove fulfilled orders from pending cache
          this.pendingOrders.delete(orderId);
        } else {
          // Keep pending/partially fulfilled orders in cache
          this.pendingOrders.set(orderId, order);
        }
      }
      
      return order;
    } catch (error) {
      this.logError(`Error getting order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Update order after partial or full shipment
   */
  public async updateOrderShipment(
    orderId: number,
    shippedItems: { productId: number; quantity: number }[]
  ): Promise<OrderEntity> {
    try {
      // Get fresh order data from database (not cache)
      const order = await this.repository.findOne({ where: { orderId } });
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Add shipped items to the order's shipped items
      for (const shippedItem of shippedItems) {
        const existingShipped = order.shippedItems.find(
          (item) => item.productId === shippedItem.productId
        );

        if (existingShipped) {
          existingShipped.quantity += shippedItem.quantity;
        } else {
          order.shippedItems.push(shippedItem);
        }
      }

      order.totalShipments += 1;

      // Check if order is fully fulfilled
      const isFulfilled = this.isOrderFulfilled(order);
      const previousStatus = order.status;
      order.status = isFulfilled
        ? OrderStatus.FULFILLED
        : OrderStatus.PARTIALLY_FULFILLED;

      // Save to database
      const updatedOrder = await this.repository.save(order);

      // Update cache with fresh data
      if (isFulfilled) {
        this.pendingOrders.delete(orderId);
      } else {
        this.pendingOrders.set(orderId, updatedOrder);
      }

      this.logInfo(
        `Order ${orderId} updated - Status: ${previousStatus} → ${updatedOrder.status}, Shipments: ${updatedOrder.totalShipments}`
      );

      return updatedOrder;
    } catch (error) {
      this.logError(`Error updating order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Check if order is fully fulfilled
   */
  private isOrderFulfilled(order: OrderEntity): boolean {
    for (const requestedItem of order.requestedItems) {
      const shippedItem = order.shippedItems.find(
        (item) => item.productId === requestedItem.productId
      );

      const shippedQuantity = shippedItem ? shippedItem.quantity : 0;
      if (shippedQuantity < requestedItem.quantity) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get remaining items to fulfill for an order
   */
  public getRemainingItems(
    order: OrderEntity
  ): { productId: number; quantity: number }[] {
    const remainingItems: { productId: number; quantity: number }[] = [];

    for (const requestedItem of order.requestedItems) {
      const shippedItem = order.shippedItems.find(
        (item) => item.productId === requestedItem.productId
      );

      const shippedQuantity = shippedItem ? shippedItem.quantity : 0;
      const remainingQuantity = requestedItem.quantity - shippedQuantity;

      if (remainingQuantity > 0) {
        remainingItems.push({
          productId: requestedItem.productId,
          quantity: remainingQuantity,
        });
      }
    }

    return remainingItems;
  }

  /**
   * Get count of pending orders
   */
  public getPendingOrderCount(): number {
    return this.pendingOrders.size;
  }

  /**
   * Get all orders from the database
   */
  public async getAllOrders(): Promise<OrderEntity[]> {
    try {
      return await this.repository.find({
        order: { createdAt: "DESC" }
      });
    } catch (error) {
      this.logError("Error getting all orders", error);
      throw error;
    }
  }

  /**
   * Clear fulfilled orders from cache
   */
  public async clearFulfilledOrders(): Promise<void> {
    const orders = Array.from(this.pendingOrders.values());
    for (const order of orders) {
      if (order.status === OrderStatus.FULFILLED) {
        this.pendingOrders.delete(order.orderId);
      }
    }
  }
}