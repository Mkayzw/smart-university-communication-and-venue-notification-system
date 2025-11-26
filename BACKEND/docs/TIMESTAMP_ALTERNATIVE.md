# Alternative: Timestamp-Based Venue Booking System

## Schema Changes Required

```prisma
model VenueBooking {
  id          String   @id @default(uuid())
  venueId     String
  courseId    String?
  eventName   String?  // For non-course bookings
  startTime   DateTime // Full timestamp: 2024-11-26T09:00:00Z
  endTime     DateTime // Full timestamp: 2024-11-26T11:00:00Z
  bookedBy    String
  status      BookingStatus @default(CONFIRMED)
  createdAt   DateTime @default(now())
  
  venue       Venue    @relation(fields: [venueId], references: [id])
  course      Course?  @relation(fields: [courseId], references: [id])
  user        User     @relation(fields: [bookedBy], references: [id])
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

## Pros of Timestamp Approach:

### 1. **Precise Time Tracking**
```javascript
// Know exactly when a room was booked
{
  venueId: "Hall-A",
  startTime: new Date("2024-11-26T09:00:00Z"),
  endTime: new Date("2024-11-26T11:00:00Z"),
  status: "CONFIRMED"
}
```

### 2. **Automatic Status Updates**
```javascript
// Simple query to check if venue is occupied
const now = new Date();
const occupied = await prisma.venueBooking.findFirst({
  where: {
    venueId,
    startTime: { lte: now },
    endTime: { gt: now },
    status: 'CONFIRMED'
  }
});
```

### 3. **One-Time Events**
- Special lectures
- Conferences  
- Maintenance windows
- Exam sessions

### 4. **Historical Tracking**
- "How many times was Hall A used last month?"
- "What was the venue utilization rate?"
- "Show all past bookings"

## Cons of Timestamp Approach:

### 1. **Data Explosion**
- 1 course × 2 meetings/week × 15 weeks = 30 records per course
- 100 courses = 3,000 booking records per semester

### 2. **Complex Recurring Logic**
```javascript
// Creating recurring bookings requires loop
function createRecurringBooking(courseId, venueId, pattern) {
  const bookings = [];
  const startDate = new Date('2024-09-01');
  const endDate = new Date('2024-12-15');
  
  let current = new Date(startDate);
  while (current <= endDate) {
    if (pattern.daysOfWeek.includes(current.getDay())) {
      bookings.push({
        courseId,
        venueId,
        startTime: setTime(current, pattern.startTime),
        endTime: setTime(current, pattern.endTime)
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return prisma.venueBooking.createMany({ data: bookings });
}
```

### 3. **Bulk Updates Are Harder**
```javascript
// Change class time for rest of semester
await prisma.venueBooking.updateMany({
  where: {
    courseId,
    startTime: { gte: new Date() }
  },
  data: {
    // Need to calculate new time for each record
    // Can't just change "09:00" to "10:00"
  }
});
```

## Hybrid Approach (Best of Both Worlds):

```prisma
// Regular recurring schedules
model Schedule {
  dayOfWeek  DayOfWeek
  startTime  String    // "09:00"
  endTime    String    // "11:00"
  semester   String
}

// Special one-time bookings
model SpecialBooking {
  startTime  DateTime  // 2024-11-26T14:00:00Z
  endTime    DateTime  // 2024-11-26T16:00:00Z
  reason     String
}

// Exceptions to regular schedule
model ScheduleException {
  scheduleId String
  date       DateTime  // Class cancelled on this date
  type       ExceptionType // CANCELLED, RESCHEDULED
}
```

## When to Use Each Approach:

### Use Weekly Schedules (Current) When:
- Classes follow predictable patterns
- Schedule repeats throughout semester
- Need simple schedule management
- Want efficient data storage

### Use Timestamps When:
- Need precise booking history
- Handle many one-time events
- Require detailed analytics
- Building a general room booking system (not just classes)

### Use Hybrid When:
- University with both regular classes AND events
- Need flexibility for special cases
- Want optimization for common cases

## Implementation Comparison:

### Check if venue is available:

**Weekly Schedule (Current):**
```javascript
// Check day and time
const conflict = await prisma.schedule.findFirst({
  where: {
    venueId,
    dayOfWeek: 'MONDAY',
    startTime: { lte: '10:00' },
    endTime: { gt: '10:00' }
  }
});
```

**Timestamp:**
```javascript
// Check specific datetime
const requestedTime = new Date('2024-11-26T10:00:00Z');
const conflict = await prisma.venueBooking.findFirst({
  where: {
    venueId,
    startTime: { lte: requestedTime },
    endTime: { gt: requestedTime }
  }
});
```

## Conclusion:

The current weekly schedule approach is optimal for a university system because:
1. **Classes are inherently recurring**
2. **Simpler to manage semester-long schedules**
3. **Less data storage required**
4. **Easier for users to understand** ("My class is every Monday at 9 AM")

Timestamps would be better for:
- Conference room booking systems
- Hotel reservations
- Event management systems
- Any system where bookings are mostly one-time events
