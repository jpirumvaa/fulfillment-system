import { Repository, ObjectLiteral } from "typeorm";
import { Logger } from "../utils/logger";

/**
 * Abstract Service class providing common service layer functionality
 * Implements Template Method pattern for consistent service operations
 */
export abstract class Service<T extends ObjectLiteral> {
  protected repository: Repository<T>;
  protected logger: Logger;
  protected serviceName: string;

  constructor(serviceName: string, repository: Repository<T>) {
    this.serviceName = serviceName;
    this.repository = repository;
    this.logger = Logger.instance;
  }

  /**
   * Hook method for validation before operations
   * Can be overridden by concrete services
   */
  protected async validate(data: Partial<T>): Promise<void> {
    // Default implementation does nothing
    // Concrete services can override for specific validation
  }

  /**
   * Hook method for transformation before save
   * Can be overridden by concrete services
   */
  protected async beforeSave(data: Partial<T>): Promise<Partial<T>> {
    return data;
  }

  /**
   * Hook method for actions after save
   * Can be overridden by concrete services
   */
  protected async afterSave(entity: T): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Template method for finding entities
   */
  protected async findById(id: string | number): Promise<T | null> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as any,
      });
      return entity;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error finding ${this.serviceName} by id: ${message}`
      );
      throw error;
    }
  }

  /**
   * Template method for finding all entities
   */
  protected async findAll(): Promise<T[]> {
    try {
      return await this.repository.find();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error finding all ${this.serviceName}: ${message}`
      );
      throw error;
    }
  }

  /**
   * Template method for creating entities
   */
  protected async create(data: Partial<T>): Promise<T> {
    try {
      await this.validate(data);
      const transformedData = await this.beforeSave(data);
      const entity = this.repository.create(transformedData as any);
      const savedEntity = await this.repository.save(entity as any) as T;
      await this.afterSave(savedEntity);
      return savedEntity;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error creating ${this.serviceName}: ${message}`
      );
      throw error;
    }
  }

  /**
   * Template method for updating entities
   */
  protected async update(id: string | number, data: Partial<T>): Promise<T> {
    try {
      await this.validate(data);
      const transformedData = await this.beforeSave(data);
      await this.repository.update(id as any, transformedData as any);
      const updatedEntity = await this.findById(id);
      if (updatedEntity) {
        await this.afterSave(updatedEntity);
      }
      return updatedEntity!;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating ${this.serviceName}: ${message}`
      );
      throw error;
    }
  }

  /**
   * Template method for deleting entities
   */
  protected async delete(id: string | number): Promise<void> {
    try {
      await this.repository.delete(id as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error deleting ${this.serviceName}: ${message}`
      );
      throw error;
    }
  }

  /**
   * Log info messages with service context
   */
  protected logInfo(message: string): void {
    this.logger.log(`[${this.serviceName}] ${message}`);
  }

  /**
   * Log error messages with service context
   */
  protected logError(message: string, error?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error || '');
    this.logger.error(`[${this.serviceName}] ${message}${errorMessage ? ': ' + errorMessage : ''}`);
  }
}