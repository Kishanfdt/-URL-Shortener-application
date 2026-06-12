const errorHandler = (err, req, res, next) => {
  // URL Safety Blocker Error
  if (err.isUnsafe) {
    return res.status(400).json({
      success: false,
      isUnsafe: true,
      message: err.message,
      safetyInfo: err.safetyInfo
    });
  }

  let error = { ...err };
  error.message = err.message;

  // Log full stack details for developer debugging
  console.error(err.stack || err);

  // Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Mongoose Duplicate Key (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists`
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  // Fallback server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
