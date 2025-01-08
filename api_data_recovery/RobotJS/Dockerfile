FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Le fichier .dockerignore exclut les fichiers/dossiers non nécessaires
COPY . .

RUN chmod +x ./start.sh

EXPOSE 8080

CMD ["./start.sh"]