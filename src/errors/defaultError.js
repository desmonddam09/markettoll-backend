import { errorLogModel } from '../models/index.js';

const defaultError = (err, req, res, next) => {
  const status = err.status ?? 500;
  const success = err.success ?? false;
  const name = err.name ?? 'Error';
  const message = err.message ?? 'Internal Server Error.';
  const stack = err.stack ?? 'No stack available.';

  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({ success, name, message, stack });
  }

  res.status(status).json({ success, name, message });
  const errorObject = {
    status,
    success,
    name,
    message,
    path: `${req.method} ${req.url}`,
    headers: req.headers,
    body: req.body,
    files: req.files,
    stack
  };

  console.error(errorObject);
  const errorLog = new errorLogModel({ data: errorObject });
  errorLog.save().catch(err => console.log(err));
};

export default defaultError;
