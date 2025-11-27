const express = require('express');
const {
  getCourses,
  getMyCourses,
  getDepartments,
  getCourse,
  createCourse,
  enrollInCourse,
  dropCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents
} = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All course routes require authentication
router.use(authenticate);

// Get all courses
router.get('/', getCourses);

// Get my courses (Student: enrolled, Lecturer: teaching)
router.get('/my', getMyCourses);

// Get departments list
router.get('/departments', getDepartments);

// Get single course
router.get('/:id', getCourse);

// Create course (Lecturer/Admin only)
router.post('/', authorize('LECTURER', 'ADMIN'), createCourse);

// Enroll in course (Student only)
router.post('/:id/enroll', authorize('STUDENT'), enrollInCourse);

// Drop/Unenroll from course (Student only)
router.delete('/:id/enroll', authorize('STUDENT'), dropCourse);

// Update course (Lecturer/Admin)
router.put('/:id', authorize('LECTURER', 'ADMIN'), updateCourse);

// Delete course (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteCourse);

// Get course students (Lecturer/Admin)
router.get('/:id/students', authorize('LECTURER', 'ADMIN'), getCourseStudents);

module.exports = router;