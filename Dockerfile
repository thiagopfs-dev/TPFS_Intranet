FROM node:20-slim

WORKDIR /app

# Instala dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Gera a pasta 'dist' com os arquivos otimizados do React
RUN npm run build

# Define o ambiente como produção
ENV NODE_ENV=production

# A porta que o Express ouve (dentro do container)
EXPOSE 3000

# Inicia o servidor usando tsx (que já está nas suas dependências)
CMD ["npm", "start"]
