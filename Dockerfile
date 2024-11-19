# Usar uma imagem base do Node.js
FROM node:18

# Definir o diretório de trabalho no container
WORKDIR /app

# Copiar os arquivos do projeto para dentro do container
COPY . /app

# Instalar as dependências
RUN npm install

# Expor a porta do servidor
EXPOSE 3033

# Comando para iniciar a aplicação
CMD ["npm", "start"]
