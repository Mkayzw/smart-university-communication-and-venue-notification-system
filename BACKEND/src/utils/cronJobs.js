/**
 * Cron Jobs for automated tasks
 */

const { updateVenueStatuses } = require('./venueOccupancy');

/**
 * Start all cron jobs
 */
function startCronJobs() {
  // Update venue statuses every minute
  setInterval(async () => {
    try {
      await updateVenueStatuses();
    } catch (error) {
      console.error('Error updating venue statuses:', error);
    }
  }, 60000); // Run every 60 seconds

  console.log('Cron jobs started: Venue status updates running every minute');
}

module.exports = {
  startCronJobs
};
