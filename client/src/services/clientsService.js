import { showError } from "@/utils/toast";
import api from "../api/client";

export const fetchClients = async () => {
  try {
    const res = await api.get("/clients");
    return res.data.clients;
  } catch (err) {
    throw new Error("Errore nel fetch dei clienti");
  }
};

export const fetchClientById = async (id) => {
  try {
    const res = await api.get(`/clients/${id}`);
    return res.data.client;
  } catch (err) {
    throw new Error("Errore nel fetch del cliente");
  }
};

export const createClient = async (payload) => {
  try {
    const res = await api.post("/clients", payload);
    return res.data.client;
  } catch (err) {
    console.log(err)
    throw new Error(err.message || "Errore nella creazione del cliente");
  }
};

export const updateClient = async (id, payload) => {
  try {
    const res = await api.put(`/clients/${id}`, payload);
    return res.data.client;
  } catch (err) {
    throw new Error(err.message || "Errore nell'aggiornamento del cliente");
  }
};

export const deleteClient = async (id) => {
  try {
    const res = await api.delete(`/clients/${id}`);
    return res.data.client;
  } catch (err) {
    showError(err.message || "Errore nell'eliminazione del cliente");
    throw new Error(err.message || "Errore nell'eliminazione del cliente");
  }
};
