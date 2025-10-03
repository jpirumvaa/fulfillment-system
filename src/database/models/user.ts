import { Entity, Column, DeleteDateColumn } from "typeorm";
import { BaseColumnSchema } from "./base";
import { UserStatus } from "../../config/constants";

@Entity({ name: "users" })
export class UserEntity extends BaseColumnSchema {
  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: "timestamp", nullable: true })
  lastLoginTime: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.INACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  profilePicture: string;


  @Column({ nullable: true })
  companyId: number;

  @Column({ name: "national_id", nullable: true })
  nationalId: string;
}
