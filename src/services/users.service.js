import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#services/auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
  } catch (error) {
    logger.error(`Error getting all users: ${error.message}`);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error(`Error getting user by id: ${error.message}`);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.email !== undefined) {
      // Check if email is already taken by another user
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);

      if (emailUser && emailUser.id !== id) {
        throw new Error('Email already exists');
      }

      updateData.email = updates.email;
    }

    if (updates.password !== undefined) {
      updateData.password = await hashPassword(updates.password);
    }

    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }

    // Update updatedAt timestamp
    updateData.updatedAt = new Date();

    // Perform update
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    throw error;
  }
};
