const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors || [{ message: 'Validation failed' }] });
  }
};

module.exports = validate;
