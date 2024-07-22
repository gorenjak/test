# SmartCart Documentation

- [Slovenščina](#slovenščina)
- [English](#english)

## Slovenščina

# SmartCart

SmartCart je spletna aplikacija, namenjena enostavnejšemu upravljanju nakupovalnih seznamov. Omogoča uporabnikom, da ustvarijo, urejajo in delijo svoje nakupovalne sezname, kar olajšuje organizacijo in načrtovanje nakupov.

SmartCart (pametni nakupovalni seznam) je progresivna spletna aplikacija (PWA), namenjena ustvarjanju in deljenju nakupovalnih seznamov. Uporabniki se lahko registrirajo s svojim uporabniškim računom, ustvarjajo poljubne nakupovalne sezname, jih delijo z drugimi uporabniki v realnem času in dodajajo podrobnosti o izdelkih, kot so npr. znamka, kategorija, cena. Aplikacija omogoča tudi prilagajanje izgleda uporabniškega vmesnika in deljenje seznamov preko e-pošte.

## Kazalo

- [Funkcionalnosti](#funkcionalnosti)
- [Namestitev](#namestitev)
- [Uporabljene Tehnologije](#uporabljene-tehnologije)

## Funkcionalnosti

- **Registracija in Prijava:** Uporabniki se lahko registrirajo in prijavijo v svoje račune.
  
- **Ustvarjanje in Urejanje Seznamov:** Možnost ustvarjanja novih nakupovalnih seznamov ter urejanje obstoječih seznamov.
  
- **Deljenje Seznamov:** Uporabniki lahko delijo svoje sezname z drugimi uporabniki v realnem času ter tudi preko e-pošte.
  
- **Dodajanje in Odstranjevanje Izdelkov:** Enostavno dodajanje novih izdelkov na seznam ter odstranjevanje izdelkov, ki jih ni več potrebno kupiti.
  
- **Modalna Okna za Obvestila:** Obvestila o uspešnih ali neuspešnih dejanjih, kot je registracija ali prijava, se prikažejo v modalnih oknih za boljšo uporabniško izkušnjo.

- **Glasovno Upravljanje:** Uporabniki lahko uporabijo glasovne ukaze za upravljanje pogostih opravil.

- **Bližnjice na Tipkovnici:** Uporabniki lahko uporabijo bližnjice za sprožitev nekaterih funkcij.

## Namestitev

1. **Prenos:** 
    - Prenesite ali klonirajte repozitorij na vaš računalnik.
    - `git clone https://github.com/gorenjak/smartcart.git`
   
2. **Namestitev Odvisnosti:** 
    - Odprite ukazno vrstico (terminal) na vašem računalniku.
    - Pojdite v mapo SmartCart, kjer ste klonirali repozitorij: `cd pot/do/ime_mape_projekta/SmartCart`
    - V terminalu ali ukazni vrstici poženite ukaz `npm install` za namestitev vseh potrebnih odvisnosti.

3. **Nastavitev okoljskih spremenljivk:**
    - Ustvarite datoteko `.env` v korenskem direktoriju.
    - Definirajte naslednje spremenljivke z vašimi podatki:

    ```dotenv
    MONGO_URI=your_mongo_uri
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REFRESH_TOKEN=your_google_refresh_token
    ```

4. **Zagon Strežnikov:** 
    - Pojdite v mapo `REST` znotraj SmartCart mape, kjer ste klonirali repozitorij: `cd pot/do/ime_mape_projekta/SmartCart/REST`
        - V terminalu ali ukazni vrstici poženite ukaz `node server.js`
        - Ta korak ponovite še za `shopping-list.js` in `push-notification.js`

5. **Zagon Aplikacije:** 
    - Pojdite v mapo `PWA` znotraj SmartCart mape, kjer ste klonirali repozitorij: `cd pot/do/ime_mape_projekta/SmartCart/PWA`
        - V terminalu ali ukazni vrstici poženite ukaz `http-server`
        - Po zagonu aplikacije lahko dostopate do nje preko spletnega brskalnika na naslovu: [http://127.0.0.1:8080](http://127.0.0.1:8080)

## Uporabljene Tehnologije

- **Frontend:**
  - HTML5, CSS3
  - JavaScript (ES6+)

- **Backend (tehnologije & moduli):**
  - Node.js
  - Express
  - MongoDB kot podatkovna baza z Mongoose za ODM
  - JWT (jsonwebtoken)
  - bcrypt
  - cors
  - dotenv
  - express-validator
  - googleapis
  - nodemailer
  - web-push
  - Socket.io

## English

# SmartCart

SmartCart is a web application designed to simplify the management of shopping lists. It allows users to create, edit, and share their shopping lists, making organization and planning easier.

SmartCart is a Progressive Web Application (PWA) intended for creating and sharing shopping lists. Users can register with their accounts, create various shopping lists, share them with other users in real-time, and add product details such as brand, category, and price. The application also supports customizing the user interface and sharing lists via email.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Technologies Used](#technologies-used)

## Features

- **Registration and Login:** Users can register and log in to their accounts.
  
- **Creating and Editing Lists:** Ability to create new shopping lists and edit existing ones.
  
- **Sharing Lists:** Users can share their lists with others in real-time and via email.
  
- **Adding and Removing Products:** Easily add new products to the list and remove products no longer needed.
  
- **Notification Modals:** Notifications about successful or unsuccessful actions, such as registration or login, are displayed in modal windows for a better user experience.

- **Voice Commands:** Users can use voice commands to manage frequent tasks.

- **Keyboard Shortcuts:** Users can use shortcuts to trigger certain functions.

## Installation

1. **Download:** 
    - Download or clone the repository to your computer.
    - `git clone https://github.com/gorenjak/smartcart.git`
   
2. **Install Dependencies:** 
    - Open the command line (terminal) on your computer.
    - Navigate to the SmartCart folder where you cloned the repository: `cd path/to/project_folder/SmartCart`
    - Run the command `npm install` in the terminal or command line to install all required dependencies.

3. **Set Up Environment Variables:**
    - Create a `.env` file in the root directory.
    - Define the following variables with your data:

    ```dotenv
    MONGO_URI=your_mongo_uri
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REFRESH_TOKEN=your_google_refresh_token
    ```

4. **Start the Servers:** 
    - Navigate to the `REST` folder inside the SmartCart directory where you cloned the repository: `cd path/to/project_folder/SmartCart/REST`
        - Run the command `node server.js` in the terminal or command line.
        - Repeat this step for `shopping-list.js` and `push-notification.js`.

5. **Run the Application:** 
    - Navigate to the `PWA` folder inside the SmartCart directory where you cloned the repository: `cd path/to/project_folder/SmartCart/PWA`
        - Run the command `http-server` in the terminal or command line.
        - Once the application is running, you can access it via your web browser at: [http://127.0.0.1:8080](http://127.0.0.1:8080)

## Technologies Used

- **Frontend:**
  - HTML5, CSS3
  - JavaScript (ES6+)

- **Backend (technologies & modules):**
  - Node.js
  - Express
  - MongoDB as the database with Mongoose for ODM
  - JWT (jsonwebtoken)
  - bcrypt
  - cors
  - dotenv
  - express-validator
  - googleapis
  - nodemailer
  - web-push
  - Socket.io