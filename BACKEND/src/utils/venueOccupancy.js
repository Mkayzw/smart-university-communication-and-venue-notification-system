/**
 * Venue Occupancy Logic
 * 
 * This module handles the logic for determining if a venue is currently occupied
 * based on the current time and scheduled classes.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get the current day of week as enum value
 */
function getCurrentDayOfWeek() {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[new Date().getDay()];
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time as HH:MM string
 */
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if a venue is currently occupied based on schedules
 */
async function isVenueCurrentlyOccupied(venueId) {
  const currentDay = getCurrentDayOfWeek();
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);

  // Find if there's a schedule for this venue at the current time
  const activeSchedule = await prisma.schedule.findFirst({
    where: {
      venueId,
      dayOfWeek: currentDay,
      AND: [
        { startTime: { lte: currentTime } },
        { endTime: { gt: currentTime } }
      ]
    },
    include: {
      course: {
        select: {
          name: true,
          code: true
        }
      }
    }
  });

  return {
    isOccupied: !!activeSchedule,
    currentSchedule: activeSchedule
  };
}

/**
 * Get all venues with their real-time occupancy status
 */
async function getVenuesWithOccupancy() {
  const venues = await prisma.venue.findMany({
    include: {
      schedules: {
        where: {
          dayOfWeek: getCurrentDayOfWeek()
        },
        include: {
          course: {
            select: {
              code: true,
              name: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      }
    }
  });

  const currentTime = getCurrentTime();

  // Add real-time occupancy status to each venue
  const venuesWithStatus = venues.map(venue => {
    // Check if venue is under maintenance
    if (venue.status === 'MAINTENANCE') {
      return {
        ...venue,
        currentStatus: 'MAINTENANCE',
        isCurrentlyOccupied: false,
        currentClass: null,
        nextClass: null
      };
    }

    // Find current and next class
    let currentClass = null;
    let nextClass = null;

    for (const schedule of venue.schedules) {
      if (schedule.startTime <= currentTime && schedule.endTime > currentTime) {
        currentClass = schedule;
      } else if (schedule.startTime > currentTime && !nextClass) {
        nextClass = schedule;
      }
    }

    return {
      ...venue,
      currentStatus: currentClass ? 'OCCUPIED' : 'AVAILABLE',
      isCurrentlyOccupied: !!currentClass,
      currentClass,
      nextClass
    };
  });

  return venuesWithStatus;
}

/**
 * Get upcoming schedule for a venue
 */
async function getVenueScheduleForToday(venueId) {
  const currentDay = getCurrentDayOfWeek();
  const currentTime = getCurrentTime();

  const schedules = await prisma.schedule.findMany({
    where: {
      venueId,
      dayOfWeek: currentDay,
      endTime: { gte: currentTime } // Only future or ongoing classes
    },
    include: {
      course: {
        include: {
          lecturer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  return schedules;
}

/**
 * Check if a venue will be available at a specific time
 */
async function isVenueAvailableAt(venueId, dayOfWeek, startTime, endTime) {
  // Check if venue is under maintenance
  const venue = await prisma.venue.findUnique({
    where: { id: venueId }
  });

  if (venue?.status === 'MAINTENANCE') {
    return false;
  }

  // Check for scheduling conflicts
  const conflict = await prisma.schedule.findFirst({
    where: {
      venueId,
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
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }
  });

  return !conflict;
}

/**
 * Automatically update venue statuses based on current time
 * This should be called periodically (e.g., every minute via a cron job)
 */
async function updateVenueStatuses() {
  const venues = await getVenuesWithOccupancy();
  
  for (const venue of venues) {
    // Skip venues under maintenance
    if (venue.status === 'MAINTENANCE') continue;

    // Determine what the status should be
    const targetStatus = venue.isCurrentlyOccupied ? 'OCCUPIED' : 'AVAILABLE';

    // Only update if status has changed
    if (venue.status !== targetStatus) {
      await prisma.venue.update({
        where: { id: venue.id },
        data: { status: targetStatus }
      });

      console.log(`Updated venue ${venue.name} status from ${venue.status} to ${targetStatus}`);
    }
  }
}

module.exports = {
  getCurrentDayOfWeek,
  getCurrentTime,
  timeToMinutes,
  isVenueCurrentlyOccupied,
  getVenuesWithOccupancy,
  getVenueScheduleForToday,
  isVenueAvailableAt,
  updateVenueStatuses
};
