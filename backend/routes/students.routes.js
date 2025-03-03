import { Router } from "express";
import { addStudent, deleteStudent, importStudents } from "../controllers/students.controller.js";
const router = Router();


router.post("/students/import", importStudents); // Import students
router.post("/students/add/", addStudent); // Import students
router.get("/students/delete/:studentId", deleteStudent); // Import students


export default router;