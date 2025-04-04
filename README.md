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

## Memo
```
{
  message_id: ...,
  from: {
    id: ...,
    is_bot: false,
    first_name: ...,
    username: ...,
    language_code: ...
  },
  chat: {
    id: ...,
    first_name: ...,
    username: ...,
    type: 'private'
  },
  date: ...,
  text: ...,
  entities: [ { offset: 0, length: 3, type: 'text_mention', user: [Object] } ]
}
```
멍청한 UserTable 대신 text_mention 써서 처리하도록 수정