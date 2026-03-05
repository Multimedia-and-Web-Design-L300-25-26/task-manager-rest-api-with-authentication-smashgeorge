import Task from "../models/Task.js";

/**
 * Create Task Controller
 * Handles task creation for the authenticated user
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createTask = async (req, res) => {
  try {
    // Get task data from request body
    const { title, description } = req.body;

    // Validate that title is provided (required field)
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Please provide a task title",
      });
    }

    // Create new task with owner set to authenticated user
    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      owner: req.user._id, // Owner is the authenticated user
    });

    // Return created task
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating task",
    });
  }
};

/**
 * Get All Tasks Controller
 * Retrieves all tasks belonging to the authenticated user
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getTasks = async (req, res) => {
  try {
    // Find all tasks where owner matches authenticated user ID
    // Sort by creation date (newest first)
    const tasks = await Task.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate("owner", "name email");

    // Return tasks
    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      count: tasks.length,
      tasks: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
    });
  }
};

/**
 * Delete Task Controller
 * Deletes a specific task (only if user is the owner)
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteTask = async (req, res) => {
  try {
    // Get task ID from URL parameters
    const taskId = req.params.id;

    // Find the task by ID
    const task = await Task.findById(taskId);

    // Check if task exists
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if authenticated user is the owner of the task
    // Convert to string for comparison since they are ObjectIds
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this task",
      });
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    // Return success response
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
    });
  }
};

/**
 * Update Task Controller
 * Updates a specific task (only if user is the owner)
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateTask = async (req, res) => {
  try {
    // Get task ID from URL parameters
    const taskId = req.params.id;

    // Get update data from request body
    const { title, description, completed } = req.body;

    // Find the task by ID
    const task = await Task.findById(taskId);

    // Check if task exists
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if authenticated user is the owner of the task
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task",
      });
    }

    // Update task fields if provided
    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (completed !== undefined) task.completed = completed;

    // Save updated task
    await task.save();

    // Return updated task
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task",
    });
  }
};
