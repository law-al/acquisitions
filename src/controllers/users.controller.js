import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import { jwtToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import logger from '#config/logger.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({
      message: 'Users fetched successfully',
      data: users,
      count: users.length,
    });
  } catch (error) {
    logger.error(`Error getting all users: ${error.message}`);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    // Validate request parameters
    const parsed = userIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(parsed.error),
      });
    }

    const { id } = parsed.data;

    // Get user from service
    const user = await getUserByIdService(id);

    logger.info(`User ${id} fetched successfully`);

    return res.status(200).json({
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    logger.error(`Error getting user by id: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Validate request parameters
    const paramParsed = userIdSchema.safeParse({ id: req.params.id });
    if (!paramParsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(paramParsed.error),
      });
    }

    // Validate request body
    const bodyParsed = updateUserSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(bodyParsed.error),
      });
    }

    const { id } = paramParsed.data;
    const updates = bodyParsed.data;

    // Get authenticated user from JWT token
    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let authenticatedUser;
    try {
      authenticatedUser = jwtToken.verify(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Authorization checks
    // Users can only update their own information, except admins can update anyone
    if (authenticatedUser.role !== 'admin' && authenticatedUser.id !== id) {
      return res.status(403).json({
        message: 'Forbidden: You can only update your own information',
      });
    }

    // Only admins can change the role field
    if (updates.role !== undefined && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden: Only admins can change user roles',
      });
    }

    // Update user
    const updatedUser = await updateUserService(id, updates);

    logger.info(
      `User ${id} updated by user ${authenticatedUser.id} (${authenticatedUser.role})`
    );

    return res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    if (error.message === 'Email already exists') {
      return res.status(400).json({ message: 'Email already exists' });
    }

    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    // Validate request parameters
    const parsed = userIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(parsed.error),
      });
    }

    const { id } = parsed.data;

    // Get authenticated user from JWT token
    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let authenticatedUser;
    try {
      authenticatedUser = jwtToken.verify(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Authorization check: Only admins can delete users, or users can delete themselves
    if (authenticatedUser.role !== 'admin' && authenticatedUser.id !== id) {
      return res.status(403).json({
        message: 'Forbidden: You can only delete your own account',
      });
    }

    // Prevent users from deleting themselves (optional business rule)
    // Uncomment if you want to prevent self-deletion
    // if (authenticatedUser.id === id) {
    //   return res.status(403).json({
    //     message: 'Forbidden: You cannot delete your own account',
    //   });
    // }

    // Delete user
    const deletedUser = await deleteUserService(id);

    logger.info(
      `User ${id} deleted by user ${authenticatedUser.id} (${authenticatedUser.role})`
    );

    return res.status(200).json({
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    next(error);
  }
};
