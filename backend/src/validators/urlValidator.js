const validateUrlInput = (req, res, next) => {
  let { originalUrl, customAlias, expiresAt } = req.body;
  const errors = {};

  // 1. Original URL validation
  if (!originalUrl || originalUrl.trim() === '') {
    errors.originalUrl = 'Original URL is required';
  } else {
    // Prepend protocol if user omitted it
    let urlToCheck = originalUrl.trim();
    if (!/^https?:\/\//i.test(urlToCheck)) {
      urlToCheck = 'http://' + urlToCheck;
      req.body.originalUrl = urlToCheck; // update in request body
    }

    // Robust URL regex validation
    const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    if (!urlRegex.test(urlToCheck)) {
      errors.originalUrl = 'Please provide a valid URL address';
    }
  }

  // 2. Custom Alias preprocessing (let service validate/fallback silently)
  if (customAlias && customAlias.trim() !== '') {
    req.body.customAlias = customAlias.trim();
  } else {
    req.body.customAlias = undefined;
  }

  // 3. Expiry Date validation (optional)
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      errors.expiresAt = 'Please provide a valid expiration date';
    } else if (expiryDate <= new Date()) {
      errors.expiresAt = 'Expiration date must be in the future';
    } else {
      req.body.expiresAt = expiryDate;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = { validateUrlInput };
