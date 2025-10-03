import { FindManyOptions, FindOneOptions } from "typeorm";

import Controller from "../services/Controller";
import { UserEntity } from "../database/models";
import db from "../database";

export default class UserController extends Controller<UserEntity> {
  constructor() {
    const userRepository = db.getRepository(UserEntity);
    super("User", userRepository);
    this.getAll = this.getAll.bind(this);
    this.createOne = this.createOne.bind(this);
    this.updateOne = this.updateOne.bind(this);
    this.getOne = this.getOne.bind(this);
  }
  protected override getFindOptions():
    | FindManyOptions<UserEntity>
    | FindOneOptions<UserEntity> {
    return {
      relations: ["profile", "roles"],
      order: { createdAt: "DESC" },
    };
  }
}
