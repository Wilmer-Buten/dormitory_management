import ExcelJS from "exceljs";

async function createTemplateWithValidation() {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();

  // Add Instructions sheet
  const instructionsSheet = workbook.addWorksheet("Instructions", {
    properties: { tabColor: { argb: "4472C4" } }, // Color azul para la pestaña
  });

  // Format the instructions sheet
  instructionsSheet.columns = [{ width: 80 }];

  // Add title with professional styling
  const titleRow = instructionsSheet.addRow(["Student Import Template - Instructions"]);
  titleRow.height = 40;
  titleRow.font = { name: "Calibri", bold: true, size: 16, color: { argb: "FFFFFF" } };
  titleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  titleRow.alignment = { vertical: "middle", horizontal: "center" };
  titleRow.border = {
    bottom: { style: "medium", color: { argb: "FFFFFF" } },
  };

  // Add empty row for spacing
  instructionsSheet.addRow([""]).height = 10;

  // Add instructions with clean formatting
  const instructionHeader = instructionsSheet.addRow([
    "Please follow these guidelines when filling out the template:",
  ]);
  instructionHeader.font = { name: "Calibri", bold: true, size: 12, color: { argb: "333333" } };
  instructionHeader.alignment = { vertical: "middle" };

  instructionsSheet.addRow([""]).height = 5;

  const instructions = [
    "1. Building: Only the following values are accepted:",
    "   - Edwards",
    "   - Wade",
    "   - Holland",
    "   - Peterson",
    "   - Carter",
    "",
    "2. Suite: Must be a number with maximum 3 digits (e.g., 101, 22, 5)",
    "",
    "3. Room: Must be a single letter (e.g., A, B, C)",
    "",
    "4. All fields are required for successful import",
    "",
    "5. Please do not modify the column headers or structure of this template",
  ];

  instructions.forEach((instruction) => {
    const row = instructionsSheet.addRow([instruction]);
    row.font = { name: "Calibri", size: 11, color: { argb: "666666" } };
    row.alignment = { vertical: "middle" };
    if (instruction.startsWith("   -")) {
      row.getCell(1).alignment = { indent: 2 };
    }
  });

  // Add Students sheet
  const studentsSheet = workbook.addWorksheet("Students", {
    properties: { tabColor: { argb: "70AD47" } }, // Color verde para la pestaña
  });

  // Define columns
  studentsSheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Building", key: "building", width: 15 },
    { header: "Suite", key: "suite", width: 10 },
    { header: "Room", key: "room", width: 10 },
    { header: "", width: 5 }, // Columna E como separador
    { header: "", width: 50 }, // Columna F más ancha para Validation Rules
  ];

  // Style the header row with a modern look and lock it
  const headerRow = studentsSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber <= 4) { // Solo A-D tienen encabezados
      cell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFF" } },
      };
    }
  });

  // Add sample data
  const sampleData = [
    ["John Doe", "Edwards", "101", "A"],
    ["Jane Smith", "Wade", "202", "B"],
    ["Alex Johnson", "Holland", "303", "C"],
  ];

  sampleData.forEach((rowData) => {
    const row = studentsSheet.addRow(rowData);
    row.height = 25;
    row.eachCell((cell, colNumber) => {
      if (colNumber <= 4) { // Solo A-D tienen datos
        cell.font = { name: "Calibri", size: 11, color: { argb: "333333" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          left: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };
      }
    });
  });
 
  const maxRows = 1000; // Aplicar validaciones hasta la fila 1000
  for (let rowNumber = 2; rowNumber <= maxRows; rowNumber++) {
    // Building column (B) - dropdown list
    studentsSheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Edwards,Wade,Holland,Peterson,Carter"'],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid Building",
      error: "Please select a valid building from the list",
    };

    // Suite column (C) - 3 digit number
    studentsSheet.getCell(`C${rowNumber}`).dataValidation = {
      type: "custom",
      allowBlank: false,
      formulae: [`=AND(ISNUMBER(VALUE(C${rowNumber})),LEN(C${rowNumber})<=3)`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid Suite",
      error: "Suite must be a number with maximum 3 digits",
    };

    // Room column (D) - single letter
    studentsSheet.getCell(`D${rowNumber}`).dataValidation = {
      type: "custom",
      allowBlank: false,
      formulae: [
        `=AND(ISTEXT(D${rowNumber}),LEN(D${rowNumber})=1,NOT(ISNUMBER(VALUE(D${rowNumber}))))`,
      ],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid Room",
      error: "Room must be a single letter",
    };
  }

  // Protect the sheet, locking the header row (row 1)
  studentsSheet.protect("password123", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
  });

  // Unlock data entry cells (rows 2 to 1000, columns A-D)
  for (let rowNum = 2; rowNum <= maxRows; rowNum++) {
    ["A", "B", "C", "D"].forEach((col) => {
      const cell = studentsSheet.getCell(`${col}${rowNum}`);
      cell.protection = { locked: false };
    });
  }

  // Return the workbook
  return workbook;
}

export const generateStudentImportTemplate = async (req, res) => {
  try {
    const workbook = await createTemplateWithValidation();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="student_import_template_with_validation.xlsx"'
    );

    // Write workbook to a buffer and send it as response
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Error creating template" });
  }
};