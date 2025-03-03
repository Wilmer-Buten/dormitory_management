import { Router } from "express";
import { createUser, deleteUser, getCurrentUser, getUsers, login, logout, refreshToken, updateUser } from "../controllers/users.controller.js";
import authenticateToken from "../middlewares/authToken.js";

const router = Router();


router.get("/current_user", authenticateToken, getCurrentUser); // Get current user
router.post("/refresh_token", refreshToken); // Refresh token
router.post("/users/create", createUser); // Create a new user
router.put("/users/edit/:id", updateUser); // Update user
router.get("/users", getUsers); // Get all users
router.post("/login", login ); // Login
router.post("/logout", logout); // Logout
router.delete("/users/delete/:id", deleteUser); // Delete user
export default router; 