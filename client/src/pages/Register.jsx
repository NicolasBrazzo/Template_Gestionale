import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "../hooks/useMutation";
import { validateEmail, validatePassword, validateName } from "../utils/validators";
import { showSuccess } from "../utils/toast";
import Loader from "../components/Loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ColorBends from "../components/ColorBends";

export const Register = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const {
    mutate: doRegister,
    isLoading: loading,
    error: submitError,
  } = useMutation(
    async (payload) => {
      if (!validateName(payload.name)) {
        throw new Error("Nome non valido: minimo 2 caratteri, solo lettere, spazi, apostrofi e trattini");
      }
      if (!validateName(payload.surname)) {
        throw new Error("Cognome non valido: minimo 2 caratteri, solo lettere, spazi, apostrofi e trattini");
      }
      if (!validateEmail(payload.email)) {
        throw new Error("Formato email non valido: deve essere nel formato testo@dominio.tld");
      }
      if (!validatePassword(payload.password)) {
        throw new Error("La password deve contenere almeno 6 caratteri, una lettera maiuscola, un numero e un carattere speciale");
      }
      if (payload.password !== payload.repeatPassword) {
        throw new Error("Le password non coincidono");
      }
      const res = await register(payload);
      if (!res.ok) throw new Error(res.message);
      return res;
    },
    {
      onSuccess: () => {
        showSuccess("Registrazione avvenuta con successo");
        navigate("/dashboard");
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await doRegister({
        email,
        password,
        repeatPassword: confirmPassword,
        name: name.trim(),
        surname: surname.trim(),
      });
    } catch(error) {
      // errore già gestito dall'hook (stato `submitError`)
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 px-4 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
          transparent
        />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Rimborso Spese Aziendali</h1>
          <p className="text-sm text-muted-foreground">Registrati al gestionale</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mario"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surname">Cognome</Label>
              <Input
                id="surname"
                type="text"
                placeholder="Rossi"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive font-medium">{submitError}</p>
            )}

            <Button type="submit" className="w-full">
              Registrati
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
