const { AppError } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validator');

// Get all announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const { targetAudience, pinned } = req.query;
    
    const where = {};
    if (targetAudience) where.targetAudience = targetAudience;
    if (pinned !== undefined) where.pinned = pinned === 'true';

    const announcements = await req.prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

// Get single announcement
const getAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await req.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// Create announcement (Lecturer/Admin only)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience, pinned } = req.body;

    validateRequired(['title', 'content'], req.body);

    const announcement = await req.prisma.announcement.create({
      data: {
        title,
        content,
        targetAudience: targetAudience || 'ALL',
        pinned: pinned || false,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Emit socket event
    req.socketUtils.broadcastAnnouncement(announcement);

    // Create database notifications for target audience
    try {
      if (targetAudience === 'STUDENTS') {
        // Get all students
        const students = await req.prisma.user.findMany({
          where: { role: 'STUDENT' },
          select: { id: true }
        });
        
        // Create notifications for each student
        await Promise.all(students.map(student =>
          req.prisma.notification.create({
            data: {
              userId: student.id,
              type: 'NEW_ANNOUNCEMENT',
              message: `New announcement: ${title}`,
              link: `/announcements/${announcement.id}`
            }
          })
        ));
      } else if (targetAudience === 'LECTURERS') {
        // Get all lecturers
        const lecturers = await req.prisma.user.findMany({
          where: { role: 'LECTURER' },
          select: { id: true }
        });
        
        // Create notifications for each lecturer
        await Promise.all(lecturers.map(lecturer =>
          req.prisma.notification.create({
            data: {
              userId: lecturer.id,
              type: 'NEW_ANNOUNCEMENT',
              message: `New announcement: ${title}`,
              link: `/announcements/${announcement.id}`
            }
          })
        ));
      } else {
        // ALL - get all users except author
        const users = await req.prisma.user.findMany({
          where: {
            id: { not: req.user.id }
          },
          select: { id: true }
        });
        
        // Create notifications for each user
        await Promise.all(users.map(user =>
          req.prisma.notification.create({
            data: {
              userId: user.id,
              type: 'NEW_ANNOUNCEMENT',
              message: `New announcement: ${title}`,
              link: `/announcements/${announcement.id}`
            }
          })
        ));
      }

      // Emit Socket.IO notifications based on target audience
      const io = req.app.get('io');
      if (targetAudience === 'STUDENTS') {
        io.to('role:STUDENT').emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      } else if (targetAudience === 'LECTURERS') {
        io.to('role:LECTURERS').emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      } else {
        io.emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      }
    } catch (error) {
      console.error('Error creating announcement notifications:', error);
      // Don't fail the request if notification fails
    }

    // Send push notifications for pinned announcements
    if (announcement.pinned) {
      const users = await req.prisma.user.findMany({
        where: {
          pushToken: {
            not: null
          }
        },
        select: {
          pushToken: true
        }
      });

      const messages = users
        .filter(user => req.expo.isExpoPushToken(user.pushToken))
        .map(user => ({
          to: user.pushToken,
          sound: 'default',
          title: announcement.title,
          body: announcement.content.substring(0, 100),
          data: { announcementId: announcement.id }
        }));

      if (messages.length > 0) {
        const chunks = req.expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
          try {
            await req.expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Error sending push notifications:', error);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// Update announcement (Author/Admin only)
const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, pinned } = req.body;

    // Check if user owns the announcement or is admin
    const announcement = await req.prisma.announcement.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (announcement.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to update this announcement', 403));
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (pinned !== undefined) updateData.pinned = pinned;

    const updatedAnnouncement = await req.prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Emit socket event
    req.socketUtils.broadcastAnnouncement(updatedAnnouncement);

    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    next(error);
  }
};

// Delete announcement (Author/Admin only)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user owns the announcement or is admin
    const announcement = await req.prisma.announcement.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (announcement.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to delete this announcement', 403));
    }

    await req.prisma.announcement.delete({
      where: { id }
    });

    // Emit socket event for deletion
    req.socketUtils.emitToAll('announcement-deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add comment to announcement
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    validateRequired(['content'], req.body);

    const comment = await req.prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        announcementId: id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment (Author/Admin only)
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user owns the comment or is admin
    const comment = await req.prisma.comment.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    await req.prisma.comment.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment
};