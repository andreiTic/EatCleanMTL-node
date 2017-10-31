[![Heroku](https://heroku-badge.herokuapp.com/?app=fathomless-fortress-55443)](https://fathomless-fortress-55443.herokuapp.com/)

# Installation
#### 1. Installez MongoDB localement

    https://www.mongodb.com/download-center

#### 2. Clonez la source

Clonez le repo git avec

    git clone https://github.com/andreiTic/EatCleanMTL-node --depth 1 && cd EatCleanMTL-node

#### 3. Installez les dépendances
    npm install
    
# Notes
- La liste des contrevenants est obtenue à tout les jours a minuit (00:00:00)
- Les courriels sont envoyé au destinataires à neuf heure (09:00:00)
- Les tweets sont envoyé à neuf heure (09:00:00)
- Configurez la connection à la base de données (modules/database/databse.js). Par défaut connecté à heroku.
