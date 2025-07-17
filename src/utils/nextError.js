const nextError = (next, status, message) => {
  const error = new Error(message);
  error.status = status;
  next(error);
};

export default nextError;
