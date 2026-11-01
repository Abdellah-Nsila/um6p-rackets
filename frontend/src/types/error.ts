// the backend error shape (the status field may be `status` or `statusCode`)
export type ErrorBody = {
  status?: number;
  statusCode?: number;
  message?: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
};