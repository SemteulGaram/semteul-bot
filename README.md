# ⚗ SemteulBot
Personal multi purpose bot

## 1. How to use
```
git clone https://github.com/SemteulGaram/semteul-bot
cd semteul-bot

# Follow reference 3. Env setup

npm install
npm run build
npm start
```

## 2. Docker use
```
git clone https://github.com/SemteulGaram/semteul-bot
cd semteul-bot

# Follow reference 3. Env setup

docker build . -t <YOUR USERNAME>/semteul-bot:<version>
docker run -d <YOUR USERNAME>/semteul-bot:<version>
```

## 3. Env setup
1. Copy `.env.defaults` -> `.env` and fill in the keys
2. Copy (Google Cloud Platform - ServiceAccount json key) to `./secret/key.json`
