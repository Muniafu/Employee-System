const Wellness = require('../models/Wellness');

// ==========================
// Admin: Create Program
// ==========================
exports.createProgram = async (req, res, next) => {
  try {
    const program = await Wellness.create({
      ...req.body,
      organizationId: req.user.organizationId
    });

    res.status(201).json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Employee: Get Programs
// ==========================
exports.getPrograms = async (req, res, next) => {
  try {
    const programs = await Wellness.find({
      organizationId: req.user.organizationId,
      active: true
    }).select('title description type');

    res.json({ success: true, data: programs });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Employee: Enroll
// ==========================
exports.enroll = async (req, res, next) => {
  try {
    const { programId } = req.params;

    const program = await Wellness.findOne({
      _id: programId,
      organizationId: req.user.organizationId,
      active: true
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    const already = program.participants.find(
      p => p.employee.toString() === req.user._id.toString()
    );

    if (already) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled'
      });
    }

    program.participants.push({
      employee: req.user._id
    });

    await program.save();

    res.json({
      success: true,
      message: 'Enrolled successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ==========================
// Employee: My Programs
// ==========================
exports.getMyPrograms = async (req, res, next) => {
  try {
    const programs = await Wellness.find({
      organizationId: req.user.organizationId,
      'participants.employee': req.user._id
    }).select('title type participants');

    const filtered = programs.map(p => ({
      _id: p._id,
      title: p.title,
      type: p.type,
      status: p.participants.find(
        part => part.employee.toString() === req.user._id.toString()
      )?.status
    }));

    res.json({ success: true, data: filtered });

  } catch (err) {
    next(err);
  }
};

// ==========================
// Admin: View Participation
// ==========================
exports.getAllPrograms = async (req, res, next) => {
  try {
    const programs = await Wellness.find({
      organizationId: req.user.organizationId
    }).populate('participants.employee', 'name email');

    res.json({ success: true, data: programs });
  } catch (err) {
    next(err);
  }
};