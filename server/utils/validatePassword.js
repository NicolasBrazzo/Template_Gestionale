const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return errors;
};

module.exports = {validatePassword};