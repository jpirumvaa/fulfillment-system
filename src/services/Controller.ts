import { Request, Response, NextFunction } from "express";
import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
} from "typeorm";

import { sendResponse } from "../utils/sendResponse";

export default class Controller<T extends ObjectLiteral> {
  tableName: string;
  repository: Repository<T>;

  constructor(tableName: string, repository: Repository<T>) {
    this.tableName = tableName;
    this.repository = repository;
  }

  protected getFindOptions(): FindManyOptions<T> | FindOneOptions<T> {
    return {};
  }
  async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const options: FindManyOptions<T> = {};
      const data = await this.repository.find(options);
      return sendResponse(res, 200, `${this.tableName}s fetched`, data, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error getting ${this.tableName?.toLowerCase()}`,
        error,
        true
      );
    }
  }

  async getOne(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const id = req.params
      .id as unknown as FindOptionsWhere<T>[keyof FindOptionsWhere<T>];
    try {
      const where: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
      const options: FindOneOptions<T> = { where };
      const data = await this.repository.findOne(options);
      return sendResponse(res, 200, `${this.tableName} fetched`, data, false);
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error getting ${this.tableName?.toLowerCase()}`,
        error,
        true
      );
    }
  }

  async createOne(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const entity = this.repository.create(req.body);
      const data = await this.repository.save(entity);
      return sendResponse(
        res,
        200,
        `${this.tableName} created successfully`,
        data,
        false
      );
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error creating ${this.tableName?.toLowerCase()}`,
        error,
        true
      );
    }
  }

  async bulkCreate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const entities = this.repository.create(req.body);
      const data = await this.repository.save(entities);
      return sendResponse(
        res,
        200,
        `${this.tableName} created successfully`,
        data,
        false
      );
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error creating ${this.tableName?.toLowerCase()}s`,
        error,
        true
      );
    }
  }

  async updateOne(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const id = req.params
      .id as unknown as FindOptionsWhere<T>[keyof FindOptionsWhere<T>];
    try {
      const where: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
      await this.repository.update(where, req.body);
      const data = await this.repository.findOne({ where });
      return sendResponse(
        res,
        200,
        `${this.tableName} updated successfully`,
        data,
        false
      );
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error updating ${this.tableName?.toLowerCase()}`,
        error,
        true
      );
    }
  }
  async deleteOne(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const id = req.params
      .id as unknown as FindOptionsWhere<T>[keyof FindOptionsWhere<T>];
    try {
      const where: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
      const data = await this.repository.findOne({ where });

      if (!data) {
        return sendResponse(
          res,
          404,
          `${this.tableName} not found`,
          null,
          true
        );
      }

      await this.repository.delete(where);
      return sendResponse(
        res,
        200,
        `${this.tableName} deleted successfully`,
        data,
        false
      );
    } catch (error) {
      return sendResponse(
        res,
        500,
        `Error deleting ${this.tableName?.toLowerCase()}`,
        error,
        true
      );
    }
  }
}
