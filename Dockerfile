# Usamos una imagen ligera de Node
FROM node:20-alpine

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json primero para aprovechar la caché
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Arrancamos permitiendo conexiones externas
CMD ["npm", "run", "dev", "--", "--host"]
