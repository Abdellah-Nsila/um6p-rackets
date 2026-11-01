#!/bin/sh
set -e

# CREATEDB is only needed by `prisma migrate dev` (shadow database).
 # what you need to understand is that its used for development only mode
if [ "$APP_ENV" = "development" ]; then DEV_MODE=true; else DEV_MODE=false; fi

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v auth_pw="$(cat /run/secrets/auth_service_password)" \
  -v club_pw="$(cat /run/secrets/club_service_password)" \
  -v notif_pw="$(cat /run/secrets/notification_service_password)" \
  -v auth_user="$AUTH_USER" \
  -v club_user="$CLUB_USER" \
  -v notif_user="$NOTIFICATION_USER" \
  -v auth_schema="$AUTH_SCHEMA" \
  -v club_schema="$CLUB_SCHEMA" \
  -v notif_schema="$NOTIFICATION_SCHEMA" \
  -v dev_mode="$DEV_MODE" <<'EOF'

CREATE ROLE :"auth_user"  LOGIN PASSWORD :'auth_pw';
CREATE ROLE :"club_user"  LOGIN PASSWORD :'club_pw';
CREATE ROLE :"notif_user" LOGIN PASSWORD :'notif_pw';

CREATE SCHEMA :"auth_schema"  AUTHORIZATION :"auth_user";
CREATE SCHEMA :"club_schema"  AUTHORIZATION :"club_user";
CREATE SCHEMA :"notif_schema" AUTHORIZATION :"notif_user";

ALTER ROLE :"auth_user"  SET search_path = :"auth_schema";
ALTER ROLE :"club_user"  SET search_path = :"club_schema";
ALTER ROLE :"notif_user" SET search_path = :"notif_schema";

REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- dev only: allow `prisma migrate dev` to create its shadow database
\if :dev_mode
ALTER ROLE :"auth_user"  CREATEDB;
ALTER ROLE :"club_user"  CREATEDB;
ALTER ROLE :"notif_user" CREATEDB;
\endif
EOF