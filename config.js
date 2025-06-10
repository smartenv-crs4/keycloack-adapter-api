var config = {

    authorizationMicroservice: {
        url: null,
        access_token: null,
        tokenValidityUrl:null
    },
    decodedTokenFieldName: "UserToken",
    tokenFieldName: "access_token",
    exampleUrl: "http://MyPage.it/",
    secret: "secretKey",
    answerOnTheFly:true


};

module.exports.conf = config;

