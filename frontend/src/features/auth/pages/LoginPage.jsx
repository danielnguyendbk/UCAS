import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ROLE_CREDENTIALS } from "../constants/credentials";
import { useAuth } from "../hooks/useAuth";
import { useLoginForm } from "../hooks/useLoginForm";
const LoginPage = () => {
  const {
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
  } = useLoginForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Vui l\xF2ng nh\u1EADp \u0111\u1EA7y \u0111\u1EE7 t\xE0i kho\u1EA3n v\xE0 m\u1EADt kh\u1EA9u.");
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(username, password);
      navigate(loggedInUser.redirectPath);
    } catch (error) {
      const statusCode = error?.response?.status;
      if (statusCode === 401) {
        setError("Sai t\xE0i kho\u1EA3n ho\u1EB7c m\u1EADt kh\u1EA9u.");
      } else {
        setError("\u0110\u0103ng nh\u1EADp th\u1EA5t b\u1EA1i. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i th\xF4ng tin.");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 opacity-10",
        style: {
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "w-full max-w-4xl relative flex gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-col justify-center flex-1 text-white pr-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur", children: /* @__PURE__ */ jsx(GraduationCap, { className: "w-10 h-10 text-white" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-3", children: "H\u1EC7 th\u1ED1ng Qu\u1EA3n l\xFD" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-blue-200 mb-4", children: "Ph\xF2ng h\u1ECDc & Th\u1EDDi kh\xF3a bi\u1EC3u" }),
        /* @__PURE__ */ jsx("p", { className: "text-blue-200 leading-relaxed", children: "N\u1EC1n t\u1EA3ng qu\u1EA3n l\xFD ph\xE2n c\xF4ng ph\xF2ng h\u1ECDc, th\u1EDDi kh\xF3a bi\u1EC3u v\xE0 l\u1ECBch h\u1ECDc cho to\xE0n b\u1ED9 tr\u01B0\u1EDDng \u0111\u1EA1i h\u1ECDc, t\xEDch h\u1EE3p \u0111a vai tr\xF2, th\u1EDDi gian th\u1EF1c v\xE0 th\xE2n thi\u1EC7n ng\u01B0\u1EDDi d\xF9ng." }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-2 gap-4", children: ["48 Ph\xF2ng h\u1ECDc", "156 M\xF4n h\u1ECDc", "892 Ti\u1EBFt h\u1ECDc/tu\u1EA7n", "5 Vai tr\xF2"].map((item) => /* @__PURE__ */ jsx("div", { className: "bg-white/10 rounded-xl p-3 backdrop-blur", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: item }) }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[420px] bg-white rounded-2xl shadow-2xl p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 lg:hidden", children: /* @__PURE__ */ jsx(GraduationCap, { className: "w-7 h-7 text-white" }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 text-center", children: "\u0110\u0103ng nh\u1EADp h\u1EC7 th\u1ED1ng" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "CSMS \u2014 University Scheduling System" })
        ] }),
        error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0" }),
          error
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "username", className: "text-sm font-medium text-gray-700", children: "T\xEAn \u0111\u0103ng nh\u1EADp" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "username",
                type: "text",
                placeholder: "Nh\u1EADp username",
                value: username,
                onChange: (event) => setUsername(event.target.value),
                className: "h-11"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "text-sm font-medium text-gray-700", children: "M\u1EADt kh\u1EA9u" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "password",
                  type: showPassword ? "text" : "password",
                  placeholder: "Nh\u1EADp m\u1EADt kh\u1EA9u",
                  value: password,
                  onChange: (event) => setPassword(event.target.value),
                  className: "h-11 pr-10"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-11 bg-blue-600 hover:bg-blue-700 font-medium", disabled: loading, children: loading ? "\u0110ang \u0111\u0103ng nh\u1EADp..." : "\u0110\u0103ng nh\u1EADp" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-5 border-t border-gray-100", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mb-3 text-center font-medium uppercase tracking-wide", children: "T\xE0i kho\u1EA3n demo \u2014 click \u0111\u1EC3 \u0111i\u1EC1n" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: ROLE_CREDENTIALS.map((credential) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => fillCredential(credential),
              className: "w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-colors group",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded mr-2", children: credential.role }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: credential.hint })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 group-hover:text-blue-500 truncate max-w-[140px]", children: credential.username })
              ]
            },
            credential.role
          )) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 text-center mt-2", children: "M\u1EADt kh\u1EA9u: 123456" })
        ] })
      ] })
    ] })
  ] });
};
export {
  LoginPage
};
