#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE legato_auth;
    CREATE DATABASE legato_users;
    CREATE DATABASE legato_content;
    CREATE DATABASE legato_ip;
    CREATE DATABASE legato_payments;
EOSQL