# You have updated the prisma schema, what to do ?


##  !! OPTIONAL !!: If you want to replace the last migration folder do this, or skip this step if not:
### Switch to ./backend repo

```bash
    cd backend
    rm -rf ./apps/<microservice_name>/prisma/migrations/<migration_folder_name>

```




### Switch to ./infrastructure repo [Here we run a fresh database container only]
```bash
    cd infrastructure
    make fclean
    make init
    docker compose -f ./docker-compose.dev.yml --profile dev up -d database
```




### Switch to ./backend repo [Create the .sql file]
```bash
    cd backend
    npm run db:migrate:dev:<microservice_name> -- --name <custom_migration_name> --create-only
```



### !! IMPORTANT !!: If you have some custom rules to add, do it now, before syncing with database
#### You are sure that there are no rules you want to add manualy, then you can go ahead and run this:

```bash
    npm run db:migrate:dev:<microservice_name>
```
