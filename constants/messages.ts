
export const ERROR_MESSAGES = {
  // Auth Errors
  USER_NOT_FOUND: "User not found with the provided identifier.",
  EMAIL_ALREADY_EXISTS: "Email address is already registered.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "You are not authorized to access this resource.",
  FORBIDDEN: "Access denied. Insufficient permissions.",
  OTP_EXPIRED: "The verification code has expired.",
  OTP_INVALID: "Invalid verification code.",
  
  // Validation & Server Errors
  INTERNAL_SERVER_ERROR: "Something went wrong on our end.",
  VALIDATION_ERROR: "The data provided is incorrect.",
  BAD_REQUEST: "The request could not be processed.",
  RESOURCE_NOT_FOUND: "The requested resource was not found.",
  
  // Admin & User Errors
  USER_ALREADY_DELETED: "This user has already been deleted.",
  PROVIDER_ALREADY_APPROVED: "This service provider has already been approved.",
};

export const SUCCESS_MESSAGES = {
  // Auth Success
  LOGIN_SUCCESS: "Login successful.",
  SIGNUP_SUCCESS: "Account created successfully.",
  OTP_SENT: "Verification code sent to your email.",
  OTP_VERIFIED: "Email verified successfully.",
  
  // Admin & User Success
  USER_DELETED: "User account deleted successfully.",
  USER_UPDATED: "User account updated successfully.",
  PROVIDER_APPROVED: "Service provider account approved.",
  PROVIDER_REJECTED: "Service provider account rejected.",
};
