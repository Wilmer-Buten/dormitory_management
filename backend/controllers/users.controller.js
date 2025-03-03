import { pool } from "../db.js";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = "your-access-token-secret";
const REFRESH_TOKEN_SECRET = "your-refresh-token-secret";
const ACCESS_TOKEN_EXPIRATION = "15s";
const REFRESH_TOKEN_EXPIRATION = "7d";

function generateAccessToken(user) {
  return jwt.sign({ username: user.username }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
}

export const login = async (req, res) => {
  const { email, password } = req.body;
  const promisePool = pool.promise();
  try {
    const [result] = await promisePool.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [email, password]
    );
    console.log(result);
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const { id, name, username, role, building_id } = result[0];
    const user = { id, name, username, role, building_id };
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    console.log("Access Token:", process.env.NODE_ENV === "production");
    // Guardar refreshToken en una cookie HttpOnly
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.json({
      accessToken,
      user: {
        id,
        username,
        name,
        role: role,
        building_id: building_id
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res
      .status(401)
      .json({ message: "Invalid Credentials", error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req, res) => {
  console.log('refreshing token', req.cookies)
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken)
    return res.status(403).json({ message: "No refresh token found" });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    // Generar un nuevo accessToken
    const accessToken = generateAccessToken(user);
    res.json({ accessToken, user });
  });
};

export const getCurrentUser = async (req, res) => {
  res.json({
    message: "Authenticated",
    user: req.user,
    accessToken: generateAccessToken(req.user),
  });
};

export const createUser = async (req, res) => {
  const { username, password, name, role, building } = req.body;
  const promisePool = pool.promise();
  try {
    // Verificar si el email ya existe
    const [existingUser] = await promisePool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hashear la contraseña
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario
    const [existingBuilding] = await promisePool.query(
      "SELECT * FROM buildings WHERE name = ?",
      [building]
    );
    if (existingBuilding.length === 0) {
      return res.status(400).json({ message: "Invalid building_id" });
    }
    console.log(existingBuilding[0].id);
    const [result] = await promisePool.query(
      "INSERT INTO users (username, password, name, role, building_id) VALUES (?, ?, ?, ?, ?)",
      [username, password, name, role, existingBuilding[0].id]
    );
    console.log(result);
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id, name, username, role, building_id } = req.body;
  console.log(id, name, username, role, building_id)
  const promisePool = pool.promise();
  try {
    const [result] = await promisePool.query(
      "UPDATE users SET name = ?, username = ?, role = ?, building_id = ? WHERE id = ?",
      [name, username, role, building_id, id]
    );
    console.log(result);
    res.json({id, name, username, role, building_id});
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const promisePool = pool.promise();
    const [users] = await promisePool.query(
      ` SELECT id, username, name, role, building_id FROM users ORDER BY name ASC`
    );
    res.json(users);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log(id)
  const promisePool = pool.promise();
  try {
    const [result] = await promisePool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    console.log(result);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};