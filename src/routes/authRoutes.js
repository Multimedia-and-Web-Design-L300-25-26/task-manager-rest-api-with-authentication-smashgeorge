import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/register
// This route allows new users to create an account
router.post("/register", async (req, res) => {
  try {
    // Step 1: Get user input from request body
    const { name, email, password, passwordConfirm } = req.body;

    // Step 2: Validate input - check that all required fields are provided
    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, password",
      });
    }

    // Step 3: Check if passwords match
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Step 4: Check if user already exists with this email
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    // Step 5: Hash the password before storing it in database
    // This makes passwords secure - we never store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 6: Create a new user object with hashed password
    const newUser = await User.create({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Step 7: Return success response (without password)
    // We use toObject() to convert Mongoose document to plain object
    const userObject = newUser.toObject();
    delete userObject.password; // Remove password from response for security

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userObject,
    });
  } catch (error) {
    // Handle any errors that occur during registration
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

// POST /api/auth/login
// This route authenticates a user and returns a JWT token
router.post("/login", async (req, res) => {
  try {
    // Step 1: Get email and password from request body
    const { email, password } = req.body;

    // Step 2: Validate input - both email and password are required
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Step 3: Find user by email in database
    // Note: We use select("+password") because password is hidden by default in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    // Step 4: Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Step 5: Compare the provided password with the hashed password in database
    // bcrypt.compare returns true if passwords match, false otherwise
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Step 6: Check if password is correct
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Step 7: Generate a JWT token
    // The token contains the user's ID and expires in 24 hours
    const token = jwt.sign(
      { id: user._id }, // Payload - data to encode in token
      process.env.JWT_SECRET, // Secret key for signing
      { expiresIn: "24h" }, // Options - token expires in 24 hours
    );

    // Step 8: Return success response with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Handle any errors that occur during login
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

export default router;
