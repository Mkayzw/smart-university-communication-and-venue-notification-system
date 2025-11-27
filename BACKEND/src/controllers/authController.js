const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const { validateEmail, validatePassword, validateRole, validateRequired } = require('../utils/validator');

// JWT Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, studentId, staffId, department } = req.body;

    validateRequired(['email', 'password', 'firstName', 'lastName', 'role'], req.body);

    if (!validateEmail(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    if (!validatePassword(password)) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    if (!validateRole(role)) {
      return next(new AppError('Invalid role. Must be STUDENT, LECTURER, or ADMIN', 400));
    }

    const existingUser = await req.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await req.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        studentId,
        staffId,
        department
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequired(['email', 'password'], req.body);

    const user = await req.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken(user.id);

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};

module.exports = {
  register,
  login,
  getMe,
  generateToken
};