import { pool } from "../db.js";

export const getRooms = async (req, res) => {
  try {
    console.log('Query:', req.query);
    const date = req.query.date; // Use provided date or current date
    const buildingId =
      (req.query.building_id === "null" || req.query.role === 'admin') ? null : Number(req.query.building_id);
    console.log("Building ID:", buildingId);
    const promisePool = pool.promise();
    const [rows] = await promisePool.query(
      `
  SELECT 
    r.id, 
    r.letter, 
    s.id AS suiteId,
    s.number AS suiteNumber, 
    b.id AS buildingId,
    b.name AS building,
    IFNULL(
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', st.id,
          'name', st.name,
          'isPresent', da.isPresent,
          'lastCheckedBy', da.checkedBy,
          'lastCheckedAt', TIME_FORMAT(da.checkedAt, '%H:%i'), -- Solo hora y minutos
          'inRoom', da.in_room
          )
      ),
      JSON_ARRAY()  -- Devuelve un array vacío si no hay estudiantes
    ) AS students
  FROM rooms r
  LEFT JOIN suites s ON r.suite_id = s.id
  LEFT JOIN buildings b ON r.building_id = b.id
  LEFT JOIN students st ON r.id = st.room_id
  LEFT JOIN daily_attendance da ON st.id = da.student_id AND da.date = ?
  WHERE (? IS NULL OR b.id = ?) -- Filtrar por buildingId solo si se proporciona
  GROUP BY r.id, r.letter, s.id, s.number, b.id, b.name 
  ORDER BY b.name, s.number, r.letter
  `,
      [date, buildingId, buildingId] // Pasar el buildingId para la condición
    );
    console.log(rows[0]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching rooms", error: error.message });
  }
};

// Update student presence
export const updateStudentPresence = async (req, res) => {
  const { roomId, studentId } = req.params;
  const { isPresent, lastCheckedBy, lastCheckedAt, inRoom } = req.body;
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const lastCheckedAtToSend = `${hours}:${minutes}`; // Formato de 12 horas
  try {
    const promisePool = pool.promise();
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
      // Check if an entry already exists for today
      const [existingEntry] = await connection.query(
        "SELECT * FROM daily_attendance WHERE student_id = ? AND date = ?",
        [studentId, lastCheckedAt]
      );

      if (existingEntry.length > 0) {
        // Update existing entry
        await connection.query(
          "UPDATE daily_attendance SET isPresent = ?, checkedBy = ?, checkedAt = ?, in_room = ? WHERE student_id = ? AND date = ?",
          [isPresent, lastCheckedBy, date, inRoom, studentId, lastCheckedAt]
        );
      } else {
        // Insert new entry
        await connection.query(
          "INSERT INTO daily_attendance (student_id, date, isPresent, checkedBy, checkedAt, in_room) VALUES (?, ?, ?, ?, ?, ?)",
          [studentId, lastCheckedAt, isPresent, lastCheckedBy, date, inRoom]
        );
      }
      await connection.commit();
      res.json({
        message: "Student presence updated successfully",
        lastCheckedAt: lastCheckedAtToSend,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({
      message: "Error updating student presence",
      error: error.message,
    });
  }
};

// Reset daily checks
export const resetDailyChecks = async (req, res) => {
  try {
    await pool.query(
      "UPDATE students SET isPresent = NULL, lastCheckedBy = NULL, lastCheckedAt = NULL"
    );
    res.json({ message: "Daily checks reset successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting daily checks", error: error.message });
  }
};
