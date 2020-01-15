module.exports = {
  servers: {
    one: {
      host: 'v22015123209630421.goodsrv.de',
      username: 'maroggo',
    },
  },

  meteor: {
    name: 'rezepte',
    path: '../rezepte',
    volumes: {
      '/home/maroggo/rez_img':'/images'
    },
    servers: {
      one: {},
    },
    env: {
      PORT: 3000,        
      ROOT_URL: 'http://rezept.ee', 
      MONGO_URL: 'mongodb://localhost/meteor' 
    },
    dockerImage: 'ianmartorell/meteord-graphicsmagick',
    enableUploadProgressBar: true,
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
