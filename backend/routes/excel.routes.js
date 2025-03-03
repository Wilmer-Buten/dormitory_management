import { Router } from "express";
import { generateStudentImportTemplate } from "../controllers/excel.controller.js";
const router = Router();


export default router.get("/excel/template", generateStudentImportTemplate); // Generate student import template