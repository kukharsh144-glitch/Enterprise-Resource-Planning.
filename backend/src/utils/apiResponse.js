/**
 * Standard API Response class
 * Ensures all successful responses follow the same structure
 */
class apiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    
    // Auto-detect and correct swapped parameters (message, data)
    if (typeof data === "string" && (typeof message === "object" && message !== null || Array.isArray(message))) {
      this.data = message;
      this.message = data;
    } else {
      this.data = data;
      this.message = message;
    }
    
    this.success = statusCode < 400;
  }
}

export { apiResponse };