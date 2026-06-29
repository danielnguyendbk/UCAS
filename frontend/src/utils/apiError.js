export const getApiError = (error, fallbackMessage) => {
  const payload = error?.response?.data;

  return {
    errorCode: payload?.errorCode || null,
    message:
      payload?.message ||
      payload?.error?.message ||
      (typeof payload?.error === "string" ? payload.error : null) ||
      fallbackMessage ||
      error?.message,
    details: payload?.details ?? payload?.errors ?? null,
  };
};
