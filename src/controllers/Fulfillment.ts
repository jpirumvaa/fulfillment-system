import { Request, Response, NextFunction } from "express";
import Controller from "../services/Controller";
import { OrderEntity } from "../database/models";
import { FulfillmentService } from "../services/FulfillmentService";
import { sendResponse } from "../utils/sendResponse";
import { Logger } from "../utils/logger";
import db from "../database";

/**
 * FulfillmentController - Extends abstract Controller
 * Handles HTTP requests for the Zipline fulfillment system
 */
export default class FulfillmentController extends Controller<OrderEntity> {
  private fulfillmentService: FulfillmentService;
  private logger: Logger;

  constructor() {
    const orderRepository = db.getRepository(OrderEntity);
    super("Fulfillment", orderRepository);
    this.fulfillmentService = FulfillmentService.getInstance();
    this.logger = Logger.instance;

    // Bind methods to preserve context
    this.initCatalog = this.initCatalog.bind(this);
    this.processOrder = this.processOrder.bind(this);
    this.processRestock = this.processRestock.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.getSystemStatus = this.getSystemStatus.bind(this);
    this.getOrderShipments = this.getOrderShipments.bind(this);
    this.getAllOrders = this.getAllOrders.bind(this);
    this.getOrderQueue = this.getOrderQueue.bind(this);
    this.resetCatalog = this.resetCatalog.bind(this);
    this.getAllStock = this.getAllStock.bind(this);
    this.getProductStock = this.getProductStock.bind(this);
  }

  /**
   * POST /api/v1/fulfillment/init-catalog
   * Initialize product catalog
   */
  async initCatalog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const productInfo = req.body;

      // Validate input
      if (!Array.isArray(productInfo) || productInfo.length === 0) {
        return sendResponse(
          res,
          400,
          "Invalid product info - must be non-empty array",
          null,
          true
        );
      }

      // Validate product structure
      for (const product of productInfo) {
        if (
          typeof product.product_id !== "number" ||
          typeof product.product_name !== "string" ||
          typeof product.mass_g !== "number"
        ) {
          return sendResponse(
            res,
            400,
            "Invalid product structure - must have product_id (number), product_name (string), and mass_g (number)",
            null,
            true
          );
        }
      }

      await this.fulfillmentService.initCatalog(productInfo);

      return sendResponse(
        res,
        200,
        `Catalog initialized with ${productInfo.length} products`,
        { productCount: productInfo.length },
        false
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error initializing catalog";
      return sendResponse(
        res,
        500,
        errorMessage,
        null,
        true
      );
    }
  }

  /**
   * POST /api/v1/fulfillment/process-order
   * Process incoming order with optimizations for large quantities
   */
  async processOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const order = req.body;

      // Validate input
      if (
        !order ||
        typeof order.order_id !== "number" ||
        !Array.isArray(order.requested) ||
        order.requested.length === 0
      ) {
        return sendResponse(
          res,
          400,
          "Invalid order format - must have order_id (number) and requested (non-empty array)",
          null,
          true
        );
      }

      // Check for extremely large orders and warn
      const totalQuantity = order.requested.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      if (totalQuantity > 1000000) {
        this.logger.log(`[FulfillmentController] Processing large order ${order.order_id} with ${totalQuantity} total items`);
      }

      // Validate requested items
      for (const item of order.requested) {
        if (
          typeof item.product_id !== "number" ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0
        ) {
          return sendResponse(
            res,
            400,
            "Invalid item in order - must have product_id (number) and quantity (positive number)",
            null,
            true
          );
        }

        // Validate reasonable quantity limits
        if (item.quantity > 10000000) {
          return sendResponse(
            res,
            400,
            `Quantity too large for product ${item.product_id}: ${item.quantity} exceeds maximum of 10,000,000`,
            null,
            true
          );
        }
      }

      await this.fulfillmentService.processOrder(order);

      return sendResponse(
        res,
        200,
        `Order ${order.order_id} processed successfully`,
        { orderId: order.order_id, totalQuantity },
        false
      );
    } catch (error) {
      return sendResponse(res, 500, "Error processing order", error, true);
    }
  }

  /**
   * POST /api/v1/fulfillment/process-restock
   * Process inventory restock with optimizations for large quantities
   */
  async processRestock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const restock = req.body;

      // Validate input
      if (!Array.isArray(restock) || restock.length === 0) {
        return sendResponse(
          res,
          400,
          "Invalid restock format - must be non-empty array",
          null,
          true
        );
      }

      // Check for extremely large restocks and warn
      const totalQuantity = restock.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      if (totalQuantity > 1000000) {
        this.logger.log(`[FulfillmentController] Processing large restock with ${totalQuantity} total items across ${restock.length} products`);
      }

      // Validate restock items
      for (const item of restock) {
        if (
          typeof item.product_id !== "number" ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0
        ) {
          return sendResponse(
            res,
            400,
            "Invalid item in restock - must have product_id (number) and quantity (positive number)",
            null,
            true
          );
        }

        // Validate reasonable quantity limits
        if (item.quantity > 10000000) {
          return sendResponse(
            res,
            400,
            `Quantity too large for product ${item.product_id}: ${item.quantity} exceeds maximum of 10,000,000`,
            null,
            true
          );
        }
      }

      await this.fulfillmentService.processRestock(restock);

      return sendResponse(
        res,
        200,
        `Restock processed for ${restock.length} products`,
        { restockedProducts: restock.length, totalQuantity },
        false
      );
    } catch (error) {
      return sendResponse(res, 500, "Error processing restock", error, true);
    }
  }

  /**
   * GET /api/v1/fulfillment/order/:orderId/status
   * Get order fulfillment status
   */
  async getOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const orderId = parseInt(req.params.orderId);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, "Invalid order ID", null, true);
      }

      const status = await this.fulfillmentService.getOrderStatus(orderId);

      if (!status.order) {
        return sendResponse(res, 404, "Order not found", null, true);
      }

      return sendResponse(res, 200, "Order status retrieved", status, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error getting order status",
        error,
        true
      );
    }
  }

  /**
   * GET /api/v1/fulfillment/order/:orderId/shipments
   * Get all shipments for an order
   */
  async getOrderShipments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const orderId = parseInt(req.params.orderId);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, "Invalid order ID", null, true);
      }

      const shipments = await this.fulfillmentService.getOrderShipments(
        orderId
      );

      return sendResponse(
        res,
        200,
        "Shipments retrieved",
        { orderId, shipments },
        false
      );
    } catch (error) {
      return sendResponse(res, 500, "Error getting shipments", error, true);
    }
  }

  /**
   * GET /api/v1/fulfillment/orders
   * Get all orders
   */
  async getAllOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const orders = await this.fulfillmentService.getAllOrders();

      return sendResponse(res, 200, "All orders retrieved", orders, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error retrieving orders",
        { message: error instanceof Error ? error.message : "Unknown error" },
        true
      );
    }
  }

  /**
   * GET /api/v1/fulfillment/queue
   * Get pending orders in the queue
   */
  async getOrderQueue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const queueData = await this.fulfillmentService.getOrderQueue();

      return sendResponse(res, 200, "Order queue retrieved", queueData, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error retrieving order queue",
        { message: error instanceof Error ? error.message : "Unknown error" },
        true
      );
    }
  }

  /**
   * POST /api/v1/fulfillment/reset-catalog
   * Reset catalog initialization state
   */
  async resetCatalog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      await this.fulfillmentService.resetCatalog();

      return sendResponse(res, 200, "Catalog reset successfully", {}, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error resetting catalog",
        { message: error instanceof Error ? error.message : "Unknown error" },
        true
      );
    }
  }

  /**
   * GET /api/v1/fulfillment/stock
   * Get current stock levels for all products
   */
  async getAllStock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const stock = this.fulfillmentService.getAllStock();

      return sendResponse(res, 200, "Stock levels retrieved", stock, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error retrieving stock levels",
        { message: error instanceof Error ? error.message : "Unknown error" },
        true
      );
    }
  }

  /**
   * GET /api/v1/fulfillment/stock/:productId
   * Get stock level for a specific product
   */
  async getProductStock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return sendResponse(res, 400, "Invalid product ID", {}, true);
      }

      const stock = this.fulfillmentService.getProductStock(productId);

      if (!stock) {
        return sendResponse(res, 404, "Product not found", {}, true);
      }

      return sendResponse(res, 200, "Product stock retrieved", stock, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error retrieving product stock",
        { message: error instanceof Error ? error.message : "Unknown error" },
        true
      );
    }
  }

  /**
   * GET /api/v1/fulfillment/status
   * Get overall system status
   */
  async getSystemStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const status = await this.fulfillmentService.getSystemStatus();

      return sendResponse(res, 200, "System status retrieved", status, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        "Error getting system status",
        error,
        true
      );
    }
  }
}