FROM node:13

RUN mkdir -p /usr/src/app
RUN pwd
WORKDIR /usr/src/app
RUN pwd
COPY . /usr/src/app
RUN npm i
RUN node index.js