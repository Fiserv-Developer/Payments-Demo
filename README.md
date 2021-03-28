# Fiserv Payment API Demo

## API Keys

- Visit our [Developer Platform](https://developer.firstdata.eu/user/me/apps) and generate a sandbox key.
- Take a note of this key and your secret key as you'll need it later
- Update your secret and API key within '/api/routes/main.js'
- Please note that you'll be running this on our production endpoint as our sandbox environment is a like for like (although no transactions will be executed!)

## Setup 

- Install [NodeJs](https://nodejs.org/en/)
- Install [Yarn](https://yarnpkg.com/)
- Open 2 terminals, one in 'api' and one in 'www'
- Run 'yarn install' inside of 'www'
- Run 'npm install' inside of 'api'
- Run 'npm install uuid' inside of 'api'

## Running

- Run 'node server.js' inside of 'api'
- Run 'yarn start' inside of 'www'
- Visit  'http://localhost:3000/'

## Notes

- To get an idea of what is taking place, open Chrome, open the developer console and enable 'preserve logs's
