export const CONSTANTS = {
  APP_NAME: 'AgriSuvidha',
  VERSION: '1.0.0',
  PROBLEM_STATEMENT: 'SIH26032',
  
  // Rate limiting
  RATE_LIMITS: {
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_REQUESTS: 20,
    PUBLIC_WINDOW_MS: 1 * 60 * 1000,
    PUBLIC_MAX_REQUESTS: 120,
    BOOKING_MAX_REQUESTS: 30,
  },

  // Queue settings
  QUEUE: {
    AVG_MINUTES_PER_FARMER: 12,
    DEFAULT_BUFFER_CAPACITY: 20,
  },

  // Procurement grading moisture and foreign matter limits
  GRADING_STANDARDS: {
    WHEAT: {
      GRADE_A_MAX_MOISTURE: 12.0,
      GRADE_B_MAX_MOISTURE: 14.0,
      GRADE_C_MAX_MOISTURE: 16.0,
      MAX_FOREIGN_MATTER: 2.0,
    },
    SOYBEAN: {
      GRADE_A_MAX_MOISTURE: 10.0,
      GRADE_B_MAX_MOISTURE: 12.0,
      GRADE_C_MAX_MOISTURE: 14.0,
      MAX_FOREIGN_MATTER: 1.5,
    },
    COTTON: {
      GRADE_A_MAX_MOISTURE: 8.0,
      GRADE_B_MAX_MOISTURE: 10.0,
      GRADE_C_MAX_MOISTURE: 12.0,
      MAX_FOREIGN_MATTER: 3.0,
    },
    DEFAULT: {
      GRADE_A_MAX_MOISTURE: 12.0,
      GRADE_B_MAX_MOISTURE: 14.0,
      GRADE_C_MAX_MOISTURE: 16.0,
      MAX_FOREIGN_MATTER: 2.0,
    },
  },

  // Token expiration
  EXPIRY: {
    OTP_SECONDS: 600, // 10 minutes
    QR_TOKEN_SECONDS: 3600, // 1 hour
  },

  // Demo OTP for instant reviewer testing
  DEMO_OTP: '123456',
};
