const log = require('node-wit/lib/log');

let config;
switch(process.argv[2]){
  case 'production':
    config = {
      name: 'Production',
      db: {
        connectionLimit: 100,
        host: 'localhost',
        user: 'cccwebprod',
        password: 'ccc:1872!',
        database: 'joomla_prod'
      },
      url: 'https://www.christchurchchislehurst.org',
      botUrl: 'https://www.christchurchchislehurst.org/bot',
      port: 8445,
      fb: {
        pageId: 'ccchislehurst',
        pageToken: 'EAABy8RyyDNwBABZCfGGZCYclBEPT8WXaYeLSgbYFaA92TpN8kbvS4tzZALLsiP96QFpXB2rMw2z6vwOqrt0QVGZAPTss3hK1ZC798ZCnZCla6R5XnTZBIZAvAzZAPYaHJlxzgIAXdZAv8jO2UIoUF1EiSEZCGssMGXZBlLbdmyDdqE24OmwZDZD',
        appSecret: 'aa03f8911473f48bcf8dbb5079b906d7',
        apiUrl: 'https://graph.facebook.com/v2.7'
      },
      level: log.DEBUG
    };
    break;
  case 'preprod':
    config = {
      name: 'Test with Production database',
      db: {
        connectionLimit: 100,
        host: 'localhost',
        user: 'cccwebprod',
        password: 'ccc:1872!',
        database: 'joomla_prod'
      },
      url: 'https://www.christchurchchislehurst.org',
      botUrl: 'https://test.christchurchchislehurst.org/bot',
      port: 8446,
      fb: {
        pageId: 'ccchislehurst',
        pageToken: 'EAAPLYstn4mUBAC5aSv4xPHOrBEXZCdtn2Fmhofj1eZA4etiTRHnF4NUqWXL9jcey1u7aAKOUFFJSeapZB6tb0slLlDWTGhdtDH2ewMVKVBxluZBzBVE547qyfZCDDJoVr4ZBGM4CFezVvBvWmvfxgZANkQ2dCaASCRijKbkys73vAZDZD',
        appSecret: 'dd2bbeebae2d098c21f0944b2cf27a44',
        apiUrl: 'https://graph.facebook.com/v2.7'
      },
      level: log.DEBUG
    };
    break;
  default:
    config = {
      name: 'Test',
      db: {
        connectionLimit: 100,
        host: 'localhost',
        user: 'cccwebtest',
        password: 'ccc:1872!',
        database: 'joomla_test'
      },
      url: 'https://www.christchurchchislehurst.org',
      botUrl: 'https://test.christchurchchislehurst.org/bot',
      port: 8446,
      fb: {
        pageId: 'ccchislehursttest',
        pageToken: 'EAAPLYstn4mUBAC5aSv4xPHOrBEXZCdtn2Fmhofj1eZA4etiTRHnF4NUqWXL9jcey1u7aAKOUFFJSeapZB6tb0slLlDWTGhdtDH2ewMVKVBxluZBzBVE547qyfZCDDJoVr4ZBGM4CFezVvBvWmvfxgZANkQ2dCaASCRijKbkys73vAZDZD',
        appSecret: 'dd2bbeebae2d098c21f0944b2cf27a44',
        apiUrl: 'https://graph.facebook.com/v2.7'
      },
      level: log.DEBUG
    }
}

config.defaultImageUrl = 'files/bot/ccc-background.jpg';
config.wit =  { accessToken: 'N4VHZFYFDKN65STXTWXHB4MDNCITL3TY' };

module.exports = config;