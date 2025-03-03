import { pool } from "../db.js";

export const importStudents = async (req, res) => {
  try {
    const { students, studentSelections } = req.body;

    console.log(students, studentSelections);

    // Función para normalizar las claves de studentSelections eliminando el número al final
    const normalizeRoomKey = (key) => {
      return key.replace(/-\d+$/, ""); // Elimina el número al final del string
    };

    const normalizedSelections = Object.keys(studentSelections).reduce(
      (acc, key) => {
        const normalizedKey = normalizeRoomKey(key);

        if (!acc[normalizedKey]) {
          acc[normalizedKey] = [];
        }

        acc[normalizedKey].push(studentSelections[key]);
        return acc;
      },
      {}
    );

    for (const student of students) {
      const promisePool = pool.promise();
      const connection = await promisePool.getConnection();
      await connection.beginTransaction();

      const formattedStudent = {
        name: student.Name, // Clave capitalizada
        suite: Number(student.Suite), // Clave capitalizada
        room: student.Room.trim().toLowerCase(), // Clave capitalizada
        building: student.Building.trim().toLowerCase(), // Clave capitalizada y normalizada a minúsculas
      };

      try {
        let newStudent = { name: formattedStudent.name, room_id: "" };

        // Fetching the building
        const [building] = await connection.query(
          "SELECT * FROM buildings WHERE name = ?",
          [formattedStudent.building]
        );

        if (building.length === 0) {
          await connection.rollback();
          console.log("Building not found");
          return res.status(400).json({ message: "Invalid building" });
        }
        const buildingId = building[0].id;

        // Fetching the suite
        const [suite] = await connection.query(
          "SELECT * FROM suites WHERE number = ? AND building_id = ?",
          [formattedStudent.suite, buildingId]
        );

        if (suite.length === 0) {
          await connection.rollback();
          console.log("Suite not found");
          return res.status(400).json({ message: "Invalid suite" });
        }
        const suiteId = suite[0].id;

        // Fetching the room
        const [room] = await connection.query(
          "SELECT * FROM rooms WHERE suite_id = ? AND letter = ? AND building_id = ?",
          [suiteId, formattedStudent.room, buildingId]
        );

        if (room.length === 0) {
          await connection.rollback();
          console.log("Room not found");
          return res.status(400).json({ message: `Invalid room: ${formattedStudent.room}. Student '${formattedStudent.name}'` });
        }
        newStudent.room_id = Number(room[0].id);

        // Usar building en minúsculas para coincidir con studentSelections
        const roomKey = `${formattedStudent.building}-${formattedStudent.suite}-${formattedStudent.room.toUpperCase()}`;
        console.log("Room key:", roomKey);
        let selectedStudentIds = normalizedSelections && normalizedSelections[roomKey];

        if (selectedStudentIds) {
          for (let i = 0; i < selectedStudentIds.length; i++) {
            const selectedStudentId = selectedStudentIds[i];

            if (selectedStudentId && selectedStudentId !== "-1") {
              // Delete records from daily_attendance for the selected student
              await connection.query(
                "DELETE FROM daily_attendance WHERE student_id = ?",
                [selectedStudentId]
              );

              // Overwrite the existing student's name
              await connection.query(
                "UPDATE students SET name = ? WHERE id = ?",
                [formattedStudent.name, selectedStudentId]
              );

              // Remove the used student ID from the array
              selectedStudentIds.splice(i, 1);
              i--; // Adjust the index to account for the removal
              console.log("selectedStudentIds:", selectedStudentIds);
            }

            // If selectedStudentId is "-1", do not delete any existing students, just add the new student
            if (selectedStudentId === "-1") {
              await connection.query(
                "INSERT INTO students (name, room_id) VALUES (?, ?)",
                [formattedStudent.name, newStudent.room_id]
              );
            }
          }
        } else {
          console.log("Inserting new student:", formattedStudent.name);
          await connection.query(
            "INSERT INTO students (name, room_id) VALUES (?, ?)",
            [formattedStudent.name, newStudent.room_id]
          );
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        console.error("Error importing student:", error);
        throw error;
      } finally {
        connection.release();
      }
    }
    res.json({ message: "Students imported successfully" });
  } catch (error) {
    console.error("Error importing students:", error);
    res.status(500).json({ message: "Error importing students", error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const promisePool = pool.promise();

    // Iniciar una transacción
    await promisePool.query("START TRANSACTION");

    // Eliminar los registros relacionados en daily_attendance
    const [attendanceResult] = await promisePool.query(
      "DELETE FROM daily_attendance WHERE student_id = ?",
      [Number(studentId)]
    );
    console.log("Deleted from daily_attendance:", attendanceResult);

    // Eliminar el registro del estudiante
    const [studentResult] = await promisePool.query(
      "DELETE FROM students WHERE id = ?",
      [Number(studentId)]
    );
    console.log("Deleted from students:", studentResult);

    // Confirmar la transacción
    await promisePool.query("COMMIT");

    res.json({
      message: "Student and attendance records deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE handler:", error);

    // Si algo falla, deshacer la transacción
    await promisePool.query("ROLLBACK");

    res.status(500).json({ message: error.message, error: error.message });
  }
};

export const addStudent = async (req, res) => {
  try {
    const { name, roomId } = req.body;
    console.log(req.body);
    const promisePool = pool.promise();

    const [result] = await promisePool.query(
      "INSERT INTO students (name, room_id) VALUES (?, ?)",
      [name, Number(roomId)]
    );

    if (result.rowCount === 0) {
      throw new Error("Student not found");
    }

    res.json({
      message: "Student added successfully",
      student: {
        id: result.insertId,
        name: name,
        room_id: roomId,
        isPresent: null,
        lastCheckedBy: null,
        lastCheckedAt: null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

