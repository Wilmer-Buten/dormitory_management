import { Router } from "express";
import { getRooms, resetDailyChecks, updateStudentPresence } from "../controllers/rooms.controller.js";
const router = Router();


router.get("/rooms", getRooms); // Get all rooms
router.patch("/rooms/:roomId/students/:studentId", updateStudentPresence); // Update student presence
router.post("/reset", resetDailyChecks); // Reset daily checks


export default router;