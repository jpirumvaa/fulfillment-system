import { Repository } from "typeorm";
import { Service } from "./Service";
import { ProductEntity } from "../database/models";
import db from "../database";

/**
 * InventoryService - Centralized inventory management with singleton pattern
 * 
 * Design Patterns:
 * - Singleton: Single source of truth for inventory state
 * - Template Method: Inherits consistent service operations from base Service class
 * 
 * Key Features:
 * - In-memory catalog caching for performance
 * - Batch stock operations for high-volume processing
 * - Automatic catalog persistence to database
 * - Thread-safe stock reservation mechanisms
 */
export class InventoryService extends Service<ProductEntity> {
  private static instance: InventoryService;
  private catalog: Map<number, ProductEntity> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    const productRepository = db.getRepository(ProductEntity);
    super("InventoryService", productRepository);
    this.loadExistingCatalog();
  }

  /**
   * Load existing catalog from database on service startup
   */
  private async loadExistingCatalog(): Promise<void> {
    try {
      const existingProducts = await this.repository.find();
      if (existingProducts.length > 0) {
        this.catalog.clear();
        for (const product of existingProducts) {
          this.catalog.set(product.productId, product);
        }
        this.isInitialized = true;
        this.logInfo(`Loaded existing catalog with ${existingProducts.length} products`);
      }
    } catch (error) {
      this.logError("Error loading existing catalog", error);
    }
  }

  /**
   * Singleton getInstance method
   */
  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  /**
   * Initialize catalog with product information
   * Called once at system startup - prevents re-initialization
   */
  public async initCatalog(
    productInfo: { product_id: number; product_name: string; mass_g: number }[]
  ): Promise<void> {
    try {
      // Enforce singleton initialization
      if (this.isInitialized) {
        throw new Error("Catalog has already been initialized. Cannot reinitialize. Use 'process-restock' to add inventory or 'reset-catalog' to reset and reinitialize.");
      }

      this.logInfo("Initializing product catalog");

      // Clear existing catalog
      this.catalog.clear();

      // Create or update products in database
      for (const info of productInfo) {
        const existingProduct = await this.repository.findOne({
          where: { productId: info.product_id },
        });

        let product: ProductEntity;
        if (existingProduct) {
          // Product exists from previous run - use existing but ensure inventory starts at 0 for initialization
          existingProduct.productName = info.product_name;
          existingProduct.massG = info.mass_g;
          existingProduct.quantityInStock = 0; // Initialize to 0 as per PDF requirements
          product = await this.repository.save(existingProduct);
        } else {
          // Create new product with 0 inventory as per PDF requirements
          product = this.repository.create({
            productId: info.product_id,
            productName: info.product_name,
            massG: info.mass_g,
            quantityInStock: 0,
          });
          product = await this.repository.save(product);
        }

        this.catalog.set(info.product_id, product);
      }

      this.isInitialized = true;
      this.logInfo(`Catalog initialized with ${productInfo.length} products`);
    } catch (error) {
      this.logError("Error initializing catalog", error);
      throw error;
    }
  }

  /**
   * Process restock - add inventory to products
   * Optimized for large quantities with batch processing
   */
  public async processRestock(
    restock: { product_id: number; quantity: number }[]
  ): Promise<void> {
    try {
      this.logInfo(`Processing restock for ${restock.length} products`);

      const productsToUpdate: ProductEntity[] = [];
      const restockSummary: { productId: number; quantity: number; newTotal: number }[] = [];

      // First pass: Validate and prepare updates
      for (const item of restock) {
        const product = this.catalog.get(item.product_id);
        if (!product) {
          this.logError(`Product ${item.product_id} not found in catalog`);
          continue;
        }

        // Update stock quantity in memory
        product.quantityInStock += item.quantity;
        this.catalog.set(item.product_id, product);
        productsToUpdate.push(product);
        
        restockSummary.push({
          productId: item.product_id,
          quantity: item.quantity,
          newTotal: product.quantityInStock
        });
      }

      // Batch save all products in single transaction
      if (productsToUpdate.length > 0) {
        await this.repository.save(productsToUpdate);
        
        // Log summary instead of individual items for large batches
        if (restock.length > 10) {
          this.logInfo(`Restock completed: ${productsToUpdate.length} products updated`);
        } else {
          restockSummary.forEach(({ productId, quantity, newTotal }) => {
            this.logInfo(`Restocked product ${productId}: +${quantity} (total: ${newTotal})`);
          });
        }
      }
    } catch (error) {
      this.logError("Error processing restock", error);
      throw error;
    }
  }

  /**
   * Check if sufficient stock is available for given items
   */
  public hasStock(items: { productId: number; quantity: number }[]): boolean {
    for (const item of items) {
      const product = this.catalog.get(item.productId);
      if (!product || product.quantityInStock < item.quantity) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reserve inventory for shipment (decrement stock)
   * Optimized for large quantities with batch processing
   */
  public async reserveStock(
    items: { productId: number; quantity: number }[]
  ): Promise<void> {
    try {
      const productsToUpdate: ProductEntity[] = [];
      
      // First pass: Validate and prepare updates
      for (const item of items) {
        const product = this.catalog.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.quantityInStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${item.productId}. Available: ${product.quantityInStock}, Requested: ${item.quantity}`
          );
        }

        // Update in memory
        product.quantityInStock -= item.quantity;
        this.catalog.set(item.productId, product);
        productsToUpdate.push(product);
      }

      // Batch save all products in single transaction
      if (productsToUpdate.length > 0) {
        await this.repository.save(productsToUpdate);
      }
    } catch (error) {
      this.logError("Error reserving stock", error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  public getProduct(productId: number): ProductEntity | undefined {
    return this.catalog.get(productId);
  }

  /**
   * Get all products
   */
  public getAllProducts(): ProductEntity[] {
    return Array.from(this.catalog.values());
  }

  /**
   * Get available stock for a product
   */
  public getAvailableStock(productId: number): number {
    const product = this.catalog.get(productId);
    return product ? product.quantityInStock : 0;
  }

  /**
   * Calculate total mass for items
   */
  public calculateTotalMass(
    items: { productId: number; quantity: number }[]
  ): number {
    let totalMass = 0;
    for (const item of items) {
      const product = this.catalog.get(item.productId);
      if (product) {
        totalMass += product.massG * item.quantity;
      }
    }
    return totalMass;
  }

  /**
   * Check if catalog is initialized
   */
  public isCatalogInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset catalog initialization state
   * Allows re-initialization of the catalog system
   */
  public resetCatalog(): void {
    this.logInfo("Resetting catalog initialization state");
    this.isInitialized = false;
    this.catalog.clear();
  }

  /**
   * Get current stock levels for all products
   */
  public getAllStock(): { productId: number; productName: string; quantityInStock: number; massG: number }[] {
    const stockReport: { productId: number; productName: string; quantityInStock: number; massG: number }[] = [];
    
    for (const [productId, product] of this.catalog) {
      stockReport.push({
        productId: product.productId,
        productName: product.productName,
        quantityInStock: product.quantityInStock,
        massG: product.massG
      });
    }
    
    return stockReport.sort((a, b) => a.productId - b.productId);
  }

  /**
   * Get stock level for a specific product
   */
  public getProductStock(productId: number): { productId: number; productName: string; quantityInStock: number; massG: number } | null {
    const product = this.catalog.get(productId);
    if (!product) {
      return null;
    }
    
    return {
      productId: product.productId,
      productName: product.productName,
      quantityInStock: product.quantityInStock,
      massG: product.massG
    };
  }
}