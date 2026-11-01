import { readFileSync, existsSync } from 'fs';

export const configuration = () => {
  const readSecret = (filePath?: string): string => {
    return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8').trim() : '';
  };

  const dbUrl = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${encodeURIComponent(readSecret(process.env.DB_PASSWORD_FILE))}@database:5432/${process.env.DB_NAME}?schema=${process.env.DB_SCHEMA}`;

  const rmqUrl = process.env.RABBITMQ_URL || 
    `amqp://${process.env.RABBITMQ_USER}:${encodeURIComponent(readSecret(process.env.RABBITMQ_PASSWORD_FILE))}@rabbitmq:5672`;

  return {
    database: { url: dbUrl },
    rabbitmq: { url: rmqUrl },
  };
};

// Notes:
// - This configuration function is designed to be used in both local development and Docker environments.
// - It reads sensitive information from environment variables or secret files, ensuring that credentials are not hardcoded.
// - The function returns an object containing the database and RabbitMQ connection URLs, which can be used throughout the application.
// - encodeURIComponent: is used to safely encode any special characters in the password, ensuring that the connection strings are valid.