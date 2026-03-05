import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Authentication Middleware
// This middleware:
// 1. Extracts the JWT token from the Authorization header
// 2. Verifies the token using the JWT_SECRET
// 3. Finds the user associated with the token
// 4. Attaches the user to req.user so it can be used in route handlers
// 5. Calls next() to proceed to the next middleware/route
// If token is invalid or missing, returns a 401 Unauthorized response

const authMiddleware = async (req, res, next) => {
  try {
    // Step 1: Get the Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please include Authorization header",
      });
    }

    // Step 2: Extract the token from "Bearer <token>"
    // Split by space and get the second part (the token)
    const token = authHeader.split(" ")[1];

    // Step 3: Verify the token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Find the user by their ID from the decoded token
    const user = await User.findById(decoded.id);

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 5: Attach user to request object
    // This makes the user accessible in all protected routes via req.user
    req.user = user;

    // Step 6: Call next() to proceed to the next middleware/route handler
    next();
  } catch (error) {
    // If token verification fails (invalid, expired, etc.)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export default authMiddleware;
