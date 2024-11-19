FROM node:18
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 369
CMD ["npm", "start"]
