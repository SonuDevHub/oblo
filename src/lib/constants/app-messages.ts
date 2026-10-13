// src/lib/constants/app-messages.ts
// Standardized UI messages & edge-case errors from docs/USER_FLOW.md §12

export const APP_MESSAGES = {
  // Ride / Seat Request statuses & errors
  OWN_RIDE: "Yeh aapki ride hai",
  RIDE_FULL: "Ride full hai",
  DUPLICATE_REQUEST: "Aap pehle hi request kar chuke ho",
  PAST_RIDE: "Yeh ride nikal chuki hai",
  SEATS_KHATAM: "Seats khatam",
  BLOCKED_USER: "Aapka account block hai, admin se contact karein",
  NOT_OWNER: "Sirf ride owner yeh kar sakta hai",
  NOT_VERIFIED_OFFER: "Ride dene ke liye pehle verification karein",
  VERIFICATION_PENDING: "Verification pending — admin approve karega",
  verificationRejected: (reason: string) => `Verification reject hua: ${reason}. Dobara submit karein`,
  INVALID_FILE: "Sirf JPG, PNG ya PDF, max 2 MB",
  NO_VEHICLE: "Pehle apni gaadi add karein",
  BIKE_SEAT_LIMIT: "Bike pe sirf 1 seat ho sakti hai",
  CAR_SEAT_LIMIT: "Car mein max 3 seats (driver ke alawa)",
  PLATE_EXISTS: "Yeh number plate pehle se registered hai",
  NOT_YOUR_VEHICLE: "Yeh gaadi aapki nahi hai",
  EDIT_LOCKED_AFTER_ACCEPT: "Booking ho chuki hai, ab badlav nahi ho sakta",
  GENERIC_ERROR: "Kuch galat hua, dobara try karein",

  // Action Success Notifications
  RIDE_POSTED: "Ride post ho gayi",
  REQUEST_SENT: "Request bhej di. Owner accept karega.",
  REQUEST_CANCELLED: "Request cancel ho gayi",
  VEHICLE_ADDED: "Gaadi add ho gayi",
  VEHICLE_UPDATED: "Gaadi update ho gayi",
  VEHICLE_DELETED: "Gaadi remove ho gayi",
  VERIFICATION_SUBMITTED: "Documents submit ho gaye. Admin verify karega.",
  VERIFICATION_APPROVED: "Driver verification approve ho gayi",
  VERIFICATION_REJECTED: "Driver verification reject ho gayi",
  RIDE_CANCELLED: "Ride cancel ho gayi",
  LOGIN_SUCCESS: "Login successful!",
  SIGNUP_SUCCESS: "Account create ho gaya!",
  ACCESS_DENIED: "Access denied: Admin privileges required",
} as const;
