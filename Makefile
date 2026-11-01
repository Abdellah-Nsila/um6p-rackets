# ==============================================================================
#                                VARIABLES
# ==============================================================================
MKDIR        = mkdir -p
RM           = rm -rf

DATABASE_VOL = $(HOME)/data/database
RABBITMQ_VOL = $(HOME)/data/rabbitmq

COMPOSE = docker compose -f ./docker-compose.yml

# Compose service names, built one at a time (friendly to low RAM).
# The backend services share one Dockerfile, so after the first one
# the others are mostly cache hits.
SERVICES = database rabbitmq api_gateway \
           auth auth_migrate auth_seed \
           club club_migrate club_seed \
           notification notification_migrate notification_seed \
           frontend nginx

# Image names, exactly as written in `image:` in docker-compose.yml
IMAGES = database rabbitmq api-gateway \
         auth-service auth-migrate auth-seed \
         club-service club-migrate club-seed \
         notification-service notification-migrate notification-seed \
         frontend nginx

# ==============================================================================
#                                 TARGETS
# ==============================================================================
all: setup build

setup: init

init:
	$(MKDIR) $(DATABASE_VOL)
	$(MKDIR) $(RABBITMQ_VOL)

up: setup
	$(COMPOSE) up -d

# Build each service separately. On failure: plain retry first (RAM/network
# errors are usually transient), and only then retry without cache.
build: setup
	@for s in $(SERVICES); do \
		echo "==> building $$s"; \
		$(COMPOSE) build $$s \
		|| { echo "==> retrying $$s"; sleep 3; $(COMPOSE) build $$s; } \
		|| { echo "==> retrying $$s with --no-cache"; $(COMPOSE) build --no-cache $$s; } \
		|| exit 1; \
	done
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

stop:
	$(COMPOSE) stop

start:
	$(COMPOSE) start

status:
	docker ps

logs:
	$(COMPOSE) logs -f --tail=100

# Containers, networks and named volumes of this project
clean:
	$(COMPOSE) down --volumes --remove-orphans

# Project only: containers, volumes, data folders, and this project's images.
# Keeps the build cache and base images, so the next `make` is fast.
fclean: clean
	@sudo $(RM) $(DATABASE_VOL) $(RABBITMQ_VOL)
	-docker rmi $(IMAGES)
	-docker image prune -f

# Trim old build cache but keep the most recent 5GB of layers.
# (On newer Docker versions, use --reserved-space 5GB if this flag complains.)
cache-trim:
	docker builder prune -f --keep-storage 5GB

# Nuclear option, for when something is broken or the disk is full.
# Removes EVERYTHING (all images, cache, volumes) and restarts Docker.
# Every step is allowed to fail so the restart at the end always runs.
fclean_full:
	-$(COMPOSE) down --volumes --remove-orphans
	@sudo $(RM) $(DATABASE_VOL) $(RABBITMQ_VOL)
	-docker builder prune -af
	-docker system prune -a --volumes --force
	@sudo systemctl restart docker
	@until docker info >/dev/null 2>&1; do sleep 1; done

re: fclean all

re_full: fclean_full all

.PHONY: all setup init up build down stop start status logs \
        clean fclean cache-trim fclean_full re re_full