const express = require('express');
const router = express.Router();
const { ProcurementRequest } = require('../models/ProcurementRequest');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { authorizeRole } = require('../middlewares/RoleCheck');

// Submit a new procurement request
router.post(
  '/',
  authenticateUser,
  authorizeRole(['Staff', 'DeputyDirector', 'Director']),
  async (req, res) => {
    try {
      const { title, description, departmentId, priorityLevel, deadlineDate } = req.body;

      const newRequest = await ProcurementRequest.create({
        title,
        description,
        departmentId,
        priorityLevel,
        deadlineDate,
        requestedBy: req.user.id,
      });

      res.status(201).json({ message: 'Procurement request submitted successfully.', request: newRequest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to submit procurement request.' });
    }
  }
);

// View all procurement requests
router.get(
  '/',
  authenticateUser,
  authorizeRole(['Admin', 'Director', 'DeputyDirector']),
  async (req, res) => {
    try {
      const requests = await ProcurementRequest.findAll();
      res.status(200).json({ requests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch procurement requests.' });
    }
  }
);

// Approve or reject procurement requests
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeRole(['Director', 'DeputyDirector', 'Admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const request = await ProcurementRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({ message: 'Procurement request not found.' });
      }

      request.status = status;
      await request.save();

      res.status(200).json({ message: `Request status updated to ${status}.`, request });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update procurement request status.' });
    }
  }
);

module.exports = router;
