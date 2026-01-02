import logger from '#config/logger.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { jwtToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(parsed.error),
      });
    }
    const { name, email, password, role } = parsed.data;

    // AUTH SERVICE
    const newUser = await createUser({ name, email, password, role });

    console.log(newUser);

    const token = jwtToken.sign({
      id: newUser.id,
      role: newUser.role,
      email: newUser.email,
    });
    cookies.set(res, 'token', token);

    logger.info(`User ${name} signed up with email ${email} and role ${role}`);

    return res.status(201).json({
      message: 'User signed up successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    logger.error(`Error signing up: ${error.message}`);

    if (error.message === 'User email already exists') {
      return res.status(400).json({ message: 'Email already exists' });
    }

    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(parsed.error),
      });
    }
    const { email, password } = parsed.data;

    // AUTH SERVICE
    const user = await authenticateUser(email, password);

    const token = jwtToken.sign({
      id: user.id,
      role: user.role,
      email: user.email,
    });
    cookies.set(res, 'token', token);

    logger.info(`User ${user.name} signed in with email ${email}`);

    return res.status(200).json({
      message: 'User signed in successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Error signing in: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    if (error.message === 'Invalid password') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User signed out successfully');

    return res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (error) {
    logger.error(`Error signing out: ${error.message}`);
    next(error);
  }
};
