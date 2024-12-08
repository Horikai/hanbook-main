FROM node:18-alpine

WORKDIR /app

RUN yarn global add serve

COPY ./dist /app/

EXPOSE 8182

CMD sh -c "serve . -l ${PORT:-8182}"
