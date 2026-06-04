import { useState } from "react";
import { DEMO_PASSWORD } from "../constants/credentials";
const useLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fillCredential = (credential) => {
    setUsername(credential.username);
    setPassword(DEMO_PASSWORD);
    setError("");
  };
  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    setLoading,
    error,
    setError,
    fillCredential
  };
};
export {
  useLoginForm
};
