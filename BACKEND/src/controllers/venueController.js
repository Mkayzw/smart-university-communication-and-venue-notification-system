const { AppError } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validator');
const {
  getVenuesWithOccupancy
} = require('../utils/venueOccupancy');

// Get venues with real-time occupancy status
const getVenuesRealtime = async (req, res, next) => {
  try {
    const venues = await getVenuesWithOccupancy();
    
    res.status(200).json({
      success: true,
      data: venues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time venue status:', error);
    next(error);
  }
};

// Check available venues
const getAvailableVenues = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.query;

    const where = { status: 'AVAILABLE' };

    // If time parameters are provided, check for conflicts
    if (dayOfWeek && startTime && endTime) {
      const conflictingSchedules = await req.prisma.schedule.findMany({
        where: {
          dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ]
        },
        select: { venueId: true }
      });

      const occupiedVenueIds = conflictingSchedules.map(s => s.venueId);
      
      if (occupiedVenueIds.length > 0) {
        where.id = { notIn: occupiedVenueIds };
      }
    }

    const venues = await req.prisma.venue.findMany({
      where,
      orderBy: [
        { building: 'asc' },
        { name: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: venues
    });
  } catch (error) {
    next(error);
  }
};

// Get all venues
const getVenues = async (req, res, next) => {
  try {
    const { available, building, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (building) where.building = building;
    if (available !== undefined) where.status = available === 'true' ? 'AVAILABLE' : 'OCCUPIED';

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const venues = await req.prisma.venue.findMany({
      where,
      skip,
      take,
      include: {
        schedules: {
          include: {
            course: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get total count for pagination
    const total = await req.prisma.venue.count({ where });

    res.status(200).json({
      success: true,
      data: venues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    next(error);
  }
};

// Get single venue
const getVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venue = await req.prisma.venue.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            course: {
              select: {
                code: true,
                name: true
              }
            }
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// Create venue (Admin only)
const createVenue = async (req, res, next) => {
  try {
    const { name, building, capacity, facilities } = req.body;

    validateRequired(['name', 'building', 'capacity'], req.body);

    const venue = await req.prisma.venue.create({
      data: {
        name,
        building,
        capacity,
        facilities: facilities || [],
        status: 'AVAILABLE'
      }
    });

    // Emit socket event
    req.socketUtils.broadcastVenueChange(venue);

    res.status(201).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// Update venue (Admin only)
const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, building, capacity, facilities } = req.body;

    const venue = await req.prisma.venue.update({
      where: { id },
      data: {
        name,
        building,
        capacity,
        facilities
      }
    });

    // Emit socket event
    req.socketUtils.broadcastVenueChange(venue);

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// Update venue availability
const updateVenueAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
      return next(new AppError('Invalid status. Must be AVAILABLE, OCCUPIED, or MAINTENANCE', 400));
    }

    const venue = await req.prisma.venue.update({
      where: { id },
      data: { status }
    });

    // Emit socket event
    req.socketUtils.broadcastVenueChange(venue);

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// Delete venue (Admin only)
const deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.prisma.venue.delete({
      where: { id }
    });

    // Emit socket event for deletion
    req.socketUtils.emitToAll('venue-deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVenuesRealtime,
  getAvailableVenues,
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  updateVenueAvailability,
  deleteVenue
};