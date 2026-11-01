
# Add Admin

## Give admin role to user

```sh
docker exec -e PGPASSWORD=1337 database psql -h 127.0.0.1 -U auth_service -d rackets_db -c "UPDATE auth_schema.users SET role = 'ADMIN' WHERE email = 'coach.tennis@example.com' AND role = 'USER' RETURNING id, email, role;"
```

### Check result

```sh
docker exec -e PGPASSWORD=1337 database psql -h 127.0.0.1 -U auth_service -d rackets_db -c "SELECT id, email, role FROM auth_schema.users WHERE email = 'coach.tennis@example.com';"
```
