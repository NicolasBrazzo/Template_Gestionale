import { useState } from "react";

import Loader from "../components/Loader";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/Modal";
import { showSuccess } from "../utils/toast";
import { USERS_COLUMN_LABELS } from "../constants/columnLabels";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { DataTable } from "../components/DataTable";

const UsersForm = ({ initialData, onSubmit, error }) => {
  const [formState, setFormState] = useState({
    email: initialData?.email || "",
    password: initialData?.password || "",
    isAdmin: initialData?.isAdmin ?? false,
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="nome@esempio.it"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          value={formState.password}
          onChange={handleChange}
          placeholder={initialData ? "Cambia password" : "••••••••"}
          required={!initialData}
        />
        {initialData && (
          <p className="text-xs text-muted-foreground">Lascia vuoto per mantenere la password attuale.</p>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2.5">
        <input
          type="checkbox"
          id="isAdmin"
          name="isAdmin"
          checked={!!formState.isAdmin}
          onChange={handleChange}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="isAdmin" className="cursor-pointer">
          Utente amministratore
        </Label>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <div className="flex justify-end space-x-2 pt-1">
        <Button type="submit" size="sm">
          Salva
        </Button>
      </div>
    </form>
  );
};

const COLUMNS = [
  {
    key: "id",
    label: USERS_COLUMN_LABELS.id,
  },
  {
    key: "email",
    label: USERS_COLUMN_LABELS.email,
    sortable: true,
  },
  {
    key: "isAdmin",
    label: USERS_COLUMN_LABELS.isAdmin,
    sortable: true,
    sortType: "boolean",
    render: (user) =>
      user.isAdmin ? (
        <Badge variant="indigo">Admin</Badge>
      ) : (
        <Badge variant="muted">Utente</Badge>
      ),
  },
];

export const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useFetch(() => fetchUsers(), []);

  const {
    mutate: saveUser,
    error: saveError,
    reset: resetSaveError,
  } = useMutation(
    (formData) =>
      editingItem ? updateUser(editingItem.id, formData) : createUser(formData),
    {
      onSuccess: () => {
        showSuccess(
          editingItem
            ? "Utente aggiornato con successo"
            : "Utente creato con successo",
        );
        refetch();
        setIsModalOpen(false);
        setEditingItem(null);
      },
    },
  );

  const { mutate: removeUser } = useMutation(
    (userId) => deleteUser(userId),
    {
      onSuccess: () => {
        showSuccess("Utente eliminato con successo");
        refetch();
      },
    },
  );

  const handleDelete = async (user) => {
    const userId = user.id || user._id;
    if (!userId) return;

    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare l'utente ${user.email}?`,
    );
    if (!confirmDelete) return;

    try {
      await removeUser(userId);
    } catch {
      // errore gestito dall'hook
    }
  };

  const handleSubmit = async (formData) => {
    try {
      await saveUser(formData);
    } catch {
      // errore gestito dall'hook (stato `saveError`)
    }
  };

  const hasUsers = users && users.length > 0;

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Utenti</h1>
          <p className="text-sm text-muted-foreground">
            Visualizza, modifica e elimina gli utenti
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            resetSaveError();
            setIsModalOpen(true);
          }}
        >
          Aggiungi utente
        </Button>
      </div>

      {isLoading && <Loader />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Errore: {error.message}
        </div>
      )}

      {hasUsers && (
        <DataTable
          columns={COLUMNS}
          data={users}
          actions={{
            onEdit: (user) => {
              setEditingItem(user);
              resetSaveError();
              setIsModalOpen(true);
            },
            onDelete: handleDelete,
          }}
        />
      )}

      {!isLoading && !error && !hasUsers && (
        <p className="text-sm text-muted-foreground">
          Nessuno utente presente nel database.
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          resetSaveError();
        }}
        title={editingItem ? "Modifica utente" : "Nuovo utente"}
      >
        <UsersForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          error={saveError}
        />
      </Modal>
    </div>
  );
};
