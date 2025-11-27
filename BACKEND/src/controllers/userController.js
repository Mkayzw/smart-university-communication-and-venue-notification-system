const { AppError } = require('../utils/errorHandler');

// Get all users (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (department) {
      where.department = department;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { staffId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      req.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          studentId: true,
          staffId: true,
          createdAt: true
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      req.prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, pushToken } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to update this profile', 403));
    }

    const updatedUser = await req.prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        department,
        pushToken
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        pushToken: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser
};