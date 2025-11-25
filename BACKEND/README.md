# Smart University Backend - Monolith Version

This is the monolith version of the Smart University Communication and Venue Notification System backend, optimized for deployment on platforms like Render, Heroku, or Railway.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Support for Students, Lecturers, and Admins
- **Course Management**: Create, enroll, and manage courses
- **Announcements**: Priority-based announcement system with real-time updates
- **Schedule Management**: Class scheduling with venue conflict detection
- **Venue Management**: Track and manage lecture halls and labs
- **Push Notifications**: Expo push notifications for mobile apps
- **Real-time Updates**: Socket.IO for live updates
- **RESTful API**: Well-structured REST endpoints
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Expo Server SDK** for push notifications

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. Clone the repository and checkout the monolith branch:
```bash
git clone <repository-url>
cd smart-university-system
git checkout monolith
cd BACKEND
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.sample .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | Secret key for JWT | Required |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | * |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin)
- `PUT /api/users/:id` - Update user profile

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Lecturer/Admin)
- `POST /api/courses/:id/enroll` - Enroll in course (Student)

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (Lecturer/Admin)

### Schedules
- `GET /api/schedules` - Get schedules
- `POST /api/schedules` - Create schedule (Lecturer/Admin)

### Venues
- `GET /api/venues` - Get venues
- `POST /api/venues` - Create venue (Admin)
- `PATCH /api/venues/:id/availability` - Update venue availability (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/push-token` - Register push token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

## Database Schema

The application uses the following main entities:
- **User**: Students, Lecturers, and Admins
- **Course**: Academic courses
- **Enrollment**: Student-course relationships
- **Announcement**: System-wide announcements
- **Schedule**: Class timetables
- **Venue**: Lecture halls and labs
- **Notification**: User notifications

## Deployment

This monolith version is optimized for easy deployment on:
- **Render**: See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)
- **Heroku**: Add Heroku Postgres addon and deploy
- **Railway**: Connect GitHub and deploy
- **DigitalOcean App Platform**: Create app from GitHub

## Development vs Production

### Development (Microservices)
The master branch contains a microservices architecture for demonstration:
- API Gateway on port 3000
- Separate services on ports 3001-3008
- Run with: `npm run start-services`

### Production (Monolith)
This monolith branch consolidates all services:
- Single application on port 3000
- Simplified deployment
- Lower resource usage
- Easier to manage

## Testing

```bash
# Run tests (when available)
npm test

# Test API endpoints
curl http://localhost:3000/health
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of an academic assignment.

## Support

For deployment issues, check the deployment guide in the root directory.
For application issues, check the logs and ensure all environment variables are set correctly.
