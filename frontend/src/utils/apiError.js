export const getApiError = (error, fallbackMessage) => {
  const payload = error?.response?.data;

  return {
    errorCode: payload?.errorCode || null,
    message: payload?.message || fallbackMessage || error?.message,
    details: payload?.details ?? payload?.errors ?? null,
  };
};
