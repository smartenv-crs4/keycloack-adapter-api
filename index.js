var express = require('express');
var conf=require('./config').conf;

var Keycloak =require('keycloak-connect');
var session=require('express-session');
var keycloak;


exports.configure=function(app,keyCloackConfig,keyCloackOptions){
    if(keyCloackOptions){
        if (keyCloackOptions.store){
            const memoryStore = new session.MemoryStore();
            app.use(
                session({
                    secret: keyCloackOptions.store.secret || 'mySecret',
                    resave: keyCloackOptions.store.resave || false,
                    saveUninitialized: keyCloackOptions.store.saveUninitialized || true,
                    store: memoryStore,
                })
            );
           keyCloackOptions.store=memoryStore;
        }
    }

    // Middleware configuration loaded from keycloak.json.removw file.
    keycloak = new Keycloak(keyCloackOptions,keyCloackConfig);
    app.use(keycloak.middleware());
};


exports.protect=function(conditions){
    return(keycloak.protect(conditions));
}
exports.enforcer=function(conditions,options){
    return(keycloak.enforcer(conditions,options));
}

/*
 <table><tbody>
 <tr><th align="left">Alessandro Romanino</th><td><a href="https://github.com/aromanino">GitHub/aromanino</a></td><td><a href="mailto:a.romanino@gmail.com">mailto:a.romanino@gmail.com</a></td></tr>
 <tr><th align="left">Guido Porruvecchio</th><td><a href="https://github.com/gporruvecchio">GitHub/porruvecchio</a></td><td><a href="mailto:guido.porruvecchio@gmail.com">mailto:guido.porruvecchio@gmail.com</a></td></tr>
 </tbody></table>
 * */