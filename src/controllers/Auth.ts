import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendResponse } from '../utils/sendResponse';
import { UserEntity } from '../database/models';
import db from '../database';

/**
 * AuthController - Handles user authentication
 */
export default class AuthController {
  private userRepository = db.getRepository(UserEntity);

  constructor() {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
  }

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return sendResponse(
          res,
          400,
          'Missing required fields: email, password, firstName, lastName',
          null,
          true
        );
      }

      // Check if user exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        return sendResponse(res, 409, 'User already exists', null, true);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
      });

      const savedUser = await this.userRepository.save(user);

      // Generate token
      const token = this.generateToken(String(savedUser.id), savedUser.email);

      return sendResponse(
        res,
        201,
        'User registered successfully',
        {
          user: {
            id: savedUser.id,
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
          },
          token,
        },
        false
      );
    } catch (error) {
      return sendResponse(res, 500, 'Error registering user', error, true);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return sendResponse(
          res,
          400,
          'Email and password are required',
          null,
          true
        );
      }

      // Find user
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        return sendResponse(
          res,
          401,
          'Invalid email or password',
          null,
          true
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return sendResponse(
          res,
          401,
          'Invalid email or password',
          null,
          true
        );
      }

      // Update last login time
      user.lastLoginTime = new Date();
      await this.userRepository.save(user);

      // Generate token
      const token = this.generateToken(String(user.id), user.email);

      return sendResponse(
        res,
        200,
        'Login successful',
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token,
        },
        false
      );
    } catch (error) {
      return sendResponse(res, 500, 'Error logging in', error, true);
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(id: string, email: string): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    return jwt.sign({ id, email }, secret, { expiresIn: '24h' });
  }
}