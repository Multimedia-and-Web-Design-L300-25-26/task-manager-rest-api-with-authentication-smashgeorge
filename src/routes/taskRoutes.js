import express from "express";
import Task from "../models/Task.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to ALL task routes
// This means every route below requires a valid JWT token
router.use(authMiddleware);

// POST /api/tasks
// Create a new task for the authenticated user
router.post("/", async (req, res) => {
  try {
    // Step 1: Get task data from request body
    const { title, description } = req.body;

    // Step 2: Validate input - title is required
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Please provide a task title",
      });
    }

    // Step 3: Create a new task object
    // The owner is automatically set to the authenticated user (req.user._id)
    const newTask = new Task({
      title: title,
      description: description || "", // description is optional
      owner: req.user._id, // The authenticated user is the owner
    });

    // Step 4: Save the task to the database
    await newTask.save();

    // Step 5: Return the created task
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    // Handle any errors during task creation
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
});

// GET /api/tasks
// Retrieve all tasks belonging to the authenticated user
router.get("/", async (req, res) => {
  try {
    // Step 1: Find all tasks where owner matches the authenticated user
    // req.user._id is set by the authMiddleware
    const tasks = await Task.find({ owner: req.user._id }).sort({
      createdAt: -1, // Sort by most recent first
    });

    // Step 2: Return the tasks
    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      count: tasks.length, // Include count of tasks
      tasks: tasks,
    });
  } catch (error) {
    // Handle any errors during retrieval
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
      error: error.message,
    });
  }
});

// DELETE /api/tasks/:id
// Delete a specific task (only if the authenticated user is the owner)
router.delete("/:id", async (req, res) => {
  try {
    // Step 1: Get the task ID from URL parameters
    const taskId = req.params.id;

    // Step 2: Find the task by ID
    const task = await Task.findById(taskId);

    // Step 3: Check if task exists
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Step 4: Check if the authenticated user is the owner of the task
    // Convert both IDs to strings for comparison (to avoid ObjectId comparison issues)
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this task",
      });
    }

    // Step 5: Delete the task
    await Task.findByIdAndDelete(taskId);

    // Step 6: Return success response
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task: task,
    });
  } catch (error) {
    // Handle any errors during deletion
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
});

export default router;
