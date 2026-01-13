// Email validation utility function
export const isValidEmail = (email) => {
  // Basic email format validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmailField = (email, fieldName = 'Email') => {
  if (!email || email.trim() === '') {
    return `${fieldName} is required`;
  }
  
  if (!isValidEmail(email)) {
    return `Please enter a valid ${fieldName.toLowerCase()} address`;
  }
  
  return null; // No error
};