const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getEmailError = (email: string) => {
  if (!email.trim()) {
    return "Email is required";
  }
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return "";
};

export const getPasswordError = (password: string) => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  if (password.length > 64) {
    return "Password must be 64 characters or fewer";
  }
  return "";
};
