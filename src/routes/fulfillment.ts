import { Router } from "express";
import FulfillmentController from "../controllers/Fulfillment";
import { authenticate } from "../middleware/auth";

const fulfillmentController = new FulfillmentController();

const route = Router();

// Apply authentication middleware to all fulfillment routes
route.use(authenticate);

/**
 * @swagger
 * /api/v1/fulfillment/init-catalog:
 *   post:
 *     summary: Initialize product catalog
 *     tags: [Fulfillment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Product'
 *           example:
 *             - product_id: 0
 *               product_name: "RBC A+ Adult"
 *               mass_g: 700
 *             - product_id: 1
 *               product_name: "RBC O- Pediatric"
 *               mass_g: 350
 *             - product_id: 2
 *               product_name: "Platelets A+"
 *               mass_g: 200
 *     responses:
 *       200:
 *         description: Catalog initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
route.post("/init-catalog", fulfillmentController.initCatalog);

/**
 * @swagger
 * /api/v1/fulfillment/process-order:
 *   post:
 *     summary: Process incoming order
 *     tags: [Fulfillment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *           example:
 *             order_id: 123
 *             requested:
 *               - product_id: 0
 *                 quantity: 2
 *               - product_id: 1
 *                 quantity: 1
 *     responses:
 *       200:
 *         description: Order processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid order format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
route.post("/process-order", fulfillmentController.processOrder);

/**
 * @swagger
 * /api/v1/fulfillment/process-restock:
 *   post:
 *     summary: Process inventory restock
 *     tags: [Fulfillment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restock'
 *           example:
 *             - product_id: 0
 *               quantity: 30
 *             - product_id: 1
 *               quantity: 25
 *             - product_id: 2
 *               quantity: 50
 *     responses:
 *       200:
 *         description: Restock processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid restock format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
route.post("/process-restock", fulfillmentController.processRestock);

/**
 * @swagger
 * /api/v1/fulfillment/order/{orderId}/status:
 *   get:
 *     summary: Get order status
 *     tags: [Fulfillment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
route.get("/order/:orderId/status", fulfillmentController.getOrderStatus);

/**
 * @swagger
 * /api/v1/fulfillment/order/{orderId}/shipments:
 *   get:
 *     summary: Get all shipments for an order
 *     tags: [Fulfillment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Shipments retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
route.get("/order/:orderId/shipments", fulfillmentController.getOrderShipments);

/**
 * @swagger
 * /api/v1/fulfillment/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Fulfillment]
 *     responses:
 *       200:
 *         description: All orders retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
route.get("/orders", fulfillmentController.getAllOrders);

/**
 * @swagger
 * /api/v1/fulfillment/queue:
 *   get:
 *     summary: Get pending orders in the queue
 *     tags: [Fulfillment]
 *     responses:
 *       200:
 *         description: Order queue retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pendingCount:
 *                   type: integer
 *                   description: Number of pending orders
 */
route.get("/queue", fulfillmentController.getOrderQueue);

/**
 * @swagger
 * /api/v1/fulfillment/reset-catalog:
 *   post:
 *     summary: Reset catalog initialization state
 *     tags: [Fulfillment]
 *     responses:
 *       200:
 *         description: Catalog reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
route.post("/reset-catalog", fulfillmentController.resetCatalog);

/**
 * @swagger
 * /api/v1/fulfillment/stock:
 *   get:
 *     summary: Get current stock levels for all products
 *     tags: [Fulfillment]
 *     responses:
 *       200:
 *         description: Stock levels retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                   productName:
 *                     type: string
 *                   quantityInStock:
 *                     type: integer
 *                   massG:
 *                     type: integer
 */
route.get("/stock", fulfillmentController.getAllStock);

/**
 * @swagger
 * /api/v1/fulfillment/stock/{productId}:
 *   get:
 *     summary: Get stock level for a specific product
 *     tags: [Fulfillment]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product stock retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                 productName:
 *                   type: string
 *                 quantityInStock:
 *                   type: integer
 *                 massG:
 *                   type: integer
 *       404:
 *         description: Product not found
 */
route.get("/stock/:productId", fulfillmentController.getProductStock);

/**
 * @swagger
 * /api/v1/fulfillment/status:
 *   get:
 *     summary: Get system status
 *     tags: [Fulfillment]
 *     responses:
 *       200:
 *         description: System status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
route.get("/status", fulfillmentController.getSystemStatus);

export default route;