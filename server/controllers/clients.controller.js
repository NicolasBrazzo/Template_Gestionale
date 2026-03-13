const express = require("express");

const {
  findAllClients,
  findClientByEmail,
  findClientById,
  createClient,
  updateClientById,
  deleteClientById,
} = require("../models/clients.model");
const protect = require("../middleware/auth");
const { validateEmail } = require("../utils/validateEmail");
const { validatePhoneNumber } = require("../utils/validatePhoneNumber");
const { findAllDeliveries } = require("../models/deliveries.model");

const router = express.Router();

// Get All Clients
router.get("/", protect, async (req, res) => {
  try {
    const clients = await findAllClients();
    return res.status(200).json({ ok: true, clients });
  } catch (err) {
    console.error("GET ALL CLIENTS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Get single client by id
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await findClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "Client not found" });
    }
    return res.status(200).json({ ok: true, client });
  } catch (err) {
    console.error("GET SINGLE CLIENT BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Create Client
router.post("/", protect, async (req, res) => {
  try {
    const { name, via, comune, provincia, phone, email, note } = req.body;

    // Validazione base dei campi
    if (!name || !via || !comune || !provincia || !phone || !email) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing required fields: name, via, comune, provincia, phone, email",
      });
    }

    const minLengthChecks = [
      { field: "name", value: name, label: "Name" },
      { field: "via", value: via, label: "Via" },
      { field: "comune", value: comune, label: "Comune" },
      { field: "provincia", value: provincia, label: "Provincia" },
    ];

    for (const { value, label } of minLengthChecks) {
      if (typeof value !== "string" || value.trim().length < 2) {
        return res.status(400).json({
          ok: false,
          error: `${label} must be at least 2 characters long`,
        });
      }
    }

    // Validazione email
    if (!validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email format: must be in the format text@domain.tld",
      });
    }

    // Validazione telefono
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid phone number: must be in the format +39XXXXXXXXXX",
      });
    }

    const existingClient = await findClientByEmail(email);
    if (existingClient) {
      return res.status(409).json({
        ok: false,
        error: "Email already in use",
      });
    }

    const client = await createClient(
      name,
      via,
      comune,
      provincia,
      phone,
      email,
      note,
    );
    console.log(client);

    return res.status(201).json({ ok: true, client });
  } catch (err) {
    console.error("CREATE CLIENT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Update Client by ID
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, via, comune, provincia, phone, email, note } = req.body;

    // Validazione email
    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid email format: must be in the format text@domain.tld",
        });
      }
    }

    // Validazione telefono
    if (phone) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid phone number: must be in the format +39XXXXXXXXXX",
        });
      }
    }

    const client = await updateClientById(id, {
      name,
      via,
      comune,
      provincia,
      phone,
      email,
      note,
    });
    return res.status(200).json({ ok: true, client });
  } catch (err) {
    console.error("UPDATE CLIENT BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Delete Client by ID — blocked if client has associated orders
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deliveries = await findAllDeliveries({ client_id: id });
    if (deliveries.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "Cliente non eliminabile: ha consegne associate",
      });
    }

    const client = await deleteClientById(id);
    return res.status(200).json({ ok: true, client });
  } catch (err) {
    console.error("DELETE CLIENT BY ID ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;
