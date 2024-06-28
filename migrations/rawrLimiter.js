const { tokenTrackLimits } = require('./questConfig');
const { logTrackingLimitReached } = require('./trackerUtils');

function rawrLimiter(req, res, next) {
  const { fid } = req.body.untrustedData;
  const userTracking = tokenTrackLimits.userTracking[fid] || { count: 0 };

  if (userTracking.count >= tokenTrackLimits.hardLimit) {
    logTrackingLimitReached(fid);
    return res.status(403).send({ message: "MAXIMUM Tracking attained; grass touch?" });
  }

  next();
}

module.exports = { rawrLimiter };