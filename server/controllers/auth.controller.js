const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { findUserByEmail, createNewUser } = require("../models/user.model");
const protect = require("../middleware/auth");
const { validateEmail } = require("../utils/validateEmail");
const { validatePassword } = require("../utils/validatePassword");

const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SALT_ROUNDS,
} = require("../config/jwt");

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email e password sono obbligatorie",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Credenziali non valide",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        ok: false,
        error: "Credenziali non valide",
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      ok: true,
      token,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Errore interno del server",
    });
  }
});

// Register (registrazione pubblica: crea sempre un utente normale)
router.post("/register", async (req, res) => {
  try {
    const { email, password, repeatPassword } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email e password sono obbligatorie",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Formato email non valido: deve essere nel formato testo@dominio.tld",
      });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: passwordErrors,
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        ok: false,
        error: "Le password non coincidono",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "Email già in uso",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // isAdmin forzato a false: la registrazione pubblica non concede privilegi
    const user = await createNewUser(email, hashedPassword, false);

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      ok: true,
      token,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Errore interno del server",
    });
  }
});

// Get current user
router.get("/me", protect, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

// Logut
router.post("/logout", (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
