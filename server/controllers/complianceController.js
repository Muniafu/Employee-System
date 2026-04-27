const Policy = require('../models/Policy');
const Compliance = require('../models/Compliance');

// ============================
// Get Active Policies
// ============================
exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find({ active: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: policies
    });

  } catch (err) {
    next(err);
  }
};

// ============================
// Acknowledge Policy
// ============================
exports.acknowledgePolicy = async (req, res, next) => {
  try {
    const policyId = req.params.id;

    const policy = await Policy.findById(policyId);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Prevent duplicate acknowledgments
    const existing = await Compliance.findOne({
      actor: req.user._id,
      action: 'policy_acknowledged',
      target: policyId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Policy already acknowledged'
      });
    }

    await Compliance.create({
      actor: req.user._id,
      action: 'policy_acknowledged',
      target: policyId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Policy acknowledged successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ============================
// Admin: View Acknowledgments
// ============================
exports.getComplianceLogs = async (req, res, next) => {
  try {
    const logs = await Compliance.find()
      .populate('actor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: logs
    });

  } catch (err) {
    next(err);
  }
};