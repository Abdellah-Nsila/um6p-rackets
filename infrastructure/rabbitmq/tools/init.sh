#!/bin/sh
set -e

# Read from Docker secrets if available
if [ -f "/run/secrets/rabbitmq_password" ]; then
    RABBITMQ_PASSWORD=$(cat /run/secrets/rabbitmq_password)
fi

# Fallback to a custom admin if variables are missing
RABBITMQ_USER=${RABBITMQ_USER:-admin}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-1337}

# Configure RabbitMQ
cat <<EOF > /etc/rabbitmq/rabbitmq.conf
default_user = ${RABBITMQ_USER}
default_pass = ${RABBITMQ_PASSWORD}
loopback_users = none
EOF

# Ensure runtime permissions are strictly locked to the rabbitmq user
chown -R rabbitmq:rabbitmq /var/lib/rabbitmq /var/log/rabbitmq /etc/rabbitmq

if [ "$1" = 'rabbitmq-server' ]; then
    exec su-exec rabbitmq "$@"
fi

exec "$@"