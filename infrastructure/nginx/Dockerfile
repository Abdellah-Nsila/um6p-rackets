FROM nginx:1.30.5-alpine3.24

# RUN apk add --no-cache openssl
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories && \
#     apk update && \
#     apk add --no-cache --upgrade openssl

RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache --upgrade openssl

COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

COPY --chmod=755 ./tools/init.sh /init.sh

ENTRYPOINT ["/init.sh"]