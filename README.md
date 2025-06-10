# keycloack-adapter-api
This module helps with the management of JWT tokens used for API authentication.
It allows encoding and decoding of the token itself, and the definition of authorizations rules.

[![NPM](https://nodei.co/npm/tokenmanager.png?downloads=true&downloadRank=true&stars=true)![NPM](https://nodei.co/npm-dl/tokenmanager.png?months=6&height=3)](https://nodei.co/npm/tokenmanager/)

This package can be used in two modes:

1.  In a distributed architecture, by calling an external service that manages
    tokens (e.g. using microservices)
2.  In a monolithic application, by managing tokens locally

If used locally, you must manage tokens and authorizations with encode, decode, addRole, upgradeRole
and downgradeRole methods.


 * [Installation](#installation)
 * [Usage](#using)
    * [function configure(config)](#configure)
    * [checkAuthorization middleware](#middleware)
    * [checkAuthorizationOnReq middleware](#middlewareOnReq)
    * [checkTokenValidity middleware](#tokenValid)
    * [checkTokenValidityOnReq middleware](#tokenValidOnReq)
    * [manage token](#manage)
        * [function encodeToken(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
        * [function decodeToken(token)](#decode)
        * [URI and token roles](#role)
            * [function addRole(roles)](#addRole)
            * [function upgradeRoles()](#upgradeRoles)
            * [function downgradeRoles()](#downgradeRoles)
            * [function getRoles()](#getRoles)
            * [function resetRoles()](#resetRoles)
            * [function testAuth()](#testAuth)
 * [Examples](#examples)
    * [Used Locally in a monolithic application](#locally)
    * [Used in a microservice architecture](#microservices)


## <a name="installation"></a>Installation
Just install it in your Express project by typing:

`npm install tokenmanager`


## <a name="using"></a>Usage

### Including tokenmanager

Require it like a normal package:

```javascript
var tokenManager = require('tokenmanager');
```

### Using tokenmanager

Tokenmanager provides a function <code>configure</code> for setting customizable tokenmanager params and
and several middleware functions for token management.

### <a name="configure"></a>`function configure(config)`
This function sets "tokenmanager" configuration properties:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
 "decodedTokenFieldName":"UserToken",
 "authorizationMicroserviceUrl":"http://localhost:3000",
 "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3",
 "exampleUrl":"http://miosito.it",
 "tokenFieldName":"access_token",
 "secret":"secretKey"
});

```
#### configuration parameters
The configuration argument must be a JSON dictionary containing only the keys defined below:

##### decodedTokenFieldName (String)
The name of the parameter used to store the decoded token. The middleware decodes the client token and, if valid and authorized, adds to the request a field
whose name is the value of key <code>decodedTokenFieldName</code>, containing the decoded token.

##### tokenFieldName (String)
The name of the parameter used to store the request token that the middleware must read and encode.
By default the middleware expects this name to be "access_token"

##### secret (String)
If the middleware is used locally, this is the secret key used to encode/decode token in **encode** and **decode** functions

##### authorizationMicroserviceUrl (String)
URL of the external authorization service used to decode/validate the token and check the authorizations, e.g.
```http://example.com:3000/checkIfTokenIsAuth ```

##### authorizationMicroserviceEncodeTokenUrl (String)
URL of the external authorization service used to decode/validate the token, e.g.
```http://example.com:3000/decodeToken ```

##### authorizationMicroserviceToken (String)
Access token to be used to call an external authorization service.

##### exampleUrl (String)
String containing the domain of your application. It is used in middleware response messages.


### <a name="middleware"></a>`checkAuthorization middleware`
This middleware decodes, validates and verifies token authorizations.
It reads the field (defined by ```tokenFieldName```) set in header/body/query param, encodes and verifies the token
and, if valid and authorized, in Express ```req``` param adds a field (defined by ```decodedTokenFieldName```)
containing the decoded result, as in:
   ```javascript
   {   
     "valid":true,  
     "token":{
              // token dictionary
     }
          
   }
   ```
If an error occurs or the token is not valid or authorised to access that resource, the middleware itself
sends a ```4xx``` response containing an object defined in this way: 
```javascript
{  
  "valid":false,
  "error":"Containing error Type name"
  "error_message":"contain error code description"     
}
```
If this middleware is not used locally but calls an external token manager, this service must have
an endpoint in ```POST``` method whose URL is set in ```authorizationMicroserviceUrl``` config param.
This endpoint must accept three body params:
```javascript
  params: {decode_token: token, URI: URI, method: req.method}
```
where:
* decode_token: access token to be verified
* URI: URI of the protected resource
* method: HTTP method used to call the protected resource

The response of the external service must be like:
```javascript 
 {valid:"", error:"", error_message: ""}
```
where:
* valid: Mandatory. If true, access_token can access the resource. Otherwise, unauthorised or expired 
* token: Optional. If ```valid==true```, contains the decoded token
* error: Optional. If ```valid==false```, contains the error type description
* error_message: If ```valid==false```, contains the error message.    

######checkAuthorization example:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
    "decodedTokenFieldName":"UserToken",
    "authorizationMicroserviceUrl":"localhost:3000",
    "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
});
router.get('/resource', tokenManager.checkAuthorization, function(req,res){
    // if you are in here the token is valid and authorized
    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results
});
```

### <a name="middlewareOnReq"></a>`checkAuthorizationOnReq middleware`
This middleware behaves like ```checkAuthorization```. It differs in just one aspect.
If an error occurs, it does not respond directly to the client with the error message. 
Instead, it propagates the error to the Express ```req``` param. 

######checkAuthorizationOnReq example:
```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
    "decodedTokenFieldName":"UserToken",
    "authorizationMicroserviceUrl":"localhost:3000",
    "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
});
router.get('/resource', tokenManager.checkAuthorizationOnReq, function(req,res){
    // if you are in here the token might not be valid or authorized
    if (req.UserToken.valid) {
        //here token is valid
    }
    else {
        //here token is not valid
    }
    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results
});

```


### <a name="tokenValid"></a>`checkTokenValidity middleware`
This middleware behaves like ```checkAuthorization```. It differs only by the fact that 
it checks only token validity, not authorizations.
If this middleware is not used locally but calls an external token manager, this service must have
an endpoint in ```POST``` method whose URL is set in ```authorizationMicroserviceEncodeTokenUrl``` config param.
This endpoint must accept one body param:
```javascript
  params: {decode_token: token}
```
where:
* decode_token: access token to be verified

The response of the external service must be like:
```javascript 
 {valid:"", error:"", error_message: ""}
```
where:
* valid: Mandatory. If true, access_token is valid
* token: Optional. If ```valid==true```, contains the decoded token
* error: Optional. If ```valid==false```, contains the error type description
* error_message: If ```valid==false```, contains the error message.    

######checkTokenValidity example:
```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
    "decodedTokenFieldName":"UserToken",
    "authorizationMicroserviceEncodeTokenUrl":"localhost:3000",
    "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
});
router.get('/resource', tokenManager.checkTokenValidity, function(req,res){
    // if you are in here the token is valid. We can't say nothing about authorization
    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results
});

```


### <a name="tokenValidOnReq"></a>`checkTokenValidityOnReq middleware`
This middleware behaves like ```checkTokenValidity```. It differs in just one aspect.
If an error occurs, it does not respond directly to the client with the error message. 
Instead, it propagates the error to the Express ```req``` param. 

######checkTokenValidityOnReq example:
```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
    "decodedTokenFieldName":"UserToken",
    "authorizationMicroserviceEncodeTokenUrl":"localhost:3000",
    "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
});
router.get('/resource', tokenManager.checkTokenValidity, function(req,res){
    // if you are in here the token might not be valid
        if (req.UserToken.valid) {
            //here token is valid. We can't say nothing about authorization
        }
        else {
            //here token is not valid
        }
    // if you are in here the token is valid. 
    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results
});

```



### <a name="manage"></a>`Token and authorization management`
If **checkAuthorization** middleware is used locally, you need to manage tokens (encode/decode) and set API endpoints roles. 
This can be accomplished with this suite of functions:

*  [encodeToken(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
*  [decodeToken(token)](#decode)
*  [addRole(roles)](#addRole)
*  [upgradeRoles()](#upgradeRoles)
*  [downgradeRoles()](#downgradeRoles)
*  [getRoles()](#getRoles)
*  [resetRoles()](#resetRoles)
*  [testAuth()](#testAuth)



#### <a name="encode"></a>`encodeToken(dictionaryToEncode,tokenTypeClass,validFor)`
This function creates a token, which contains the dictionary defined in ```dictionaryToEncode``` param.
It accepts 3 parameters:
* **dictionaryToEncode** : Dictionary to be encoded inside the token, e.g.:
```javascript
    {
      "userId":"80248",
      "Other" : "........."
    }
```
* **tokenTypeClass** : Encoded token type, e.g. ```admin``` for admin user
* **validFor** : Object containing information about token life. It has 2 keys called ```unit``` and ```value```.
                 ```unit``` is the time unit measure, and value the amount of time. ```unit``` can be:

| Unit Value    | Shorthand |
| :--------:    | :--------:|
| years         | y         |
| quarters      | Q         |
| months        | M         |
| weeks         | w         |
| days          | d         |
| hours         | h         |
| minutes       | m         |
| seconds       | s         |
| milliseconds  | ms        |


######Example :
```javascript
  // this sets token life to 7 days
  {
    unit:"days",
    value:7
  }
```

You can use this function to generate your token, like in:
```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
                         "decodedTokenFieldName":"UserToken",
                         "secret":"MyKey",
                         "exampleUrl":"http://miosito.it"
});
// dictionary to encode inside token
var toTokenize={
        "userId":"80248",
        "Other" : "........."
};
// now create a *TokenTypeOne* that expire within 1 hous.
var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});
console.log(mytoken); // it prints a token as a string like :
                      //32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57
```


#### <a name="decode"></a>`decodeToken(token)`
This function decodes the token and returns the bundled data. 
The ```token``` parameter must have been generated with ```encodeToken``` function

######Example:
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });
 // dictionary to encode inside token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };
 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encodeTokentoTokenize,"TokenTypeOne",{unit:"hours",value:1});
 console.log(mytoken); // it prints a token as a string like this:
                       //32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57
 // if you need information in the token then you can decode it.
 var decodedToken=tokenManager.decodeToken(mytoken);
 console.log(decodedToken); // it prints the unpack token information:
                            // "userId":"80248", "Other" : "........."

```

#### <a name="role"></a>`Authorization management`
Set of functions to set roles and authorizations

#### <a name="addRole"></a>`addRole(roles)`
This function must be used to set a new authorization role. 
Roles are used by *checkAuthorization* middleware to verify token authorization for a certain resource.

The ```roles``` param is an array of roles. A role is defined as:
```javascript
// *************************************************************************
// defining a role where only  "admin, tokenTypeOne, TokenTypeTwo"
// tokens type are authorized to access the resource
// "/resource" called with method "GET"
// *************************************************************************
    {
        "URI":"/resource",
        "method":"GET",
        "authToken":[admin, tokenTypeOne, TokenTypeTwo],
    }
```
where:
 * URI: URI of the resource to protect
 * method: HTTP method used to call the resource to protect
 * authToken : An array of Strings containing the token types authorized by this role


######Example of roles object:
```javascript
// *************************************************************************
//  defining a roles where:
//   1. only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized
//      to access the resource "/resource" called with method "GET"
//   2. only  "admin" tokens type are authorized to access the resource
//      "/resource" called with method "POST"
// *************************************************************************
var roles= [
        {
            "URI":"/resource",
            "method":"GET",
            "authToken":["admin","tokenTypeOne","TokenTypeTwo"]
        },
        {
            "URI":"/resource",
            "method":"POST",
            "authToken":["admin"]
        }
];

```

######Example of addRole(roles) usage

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken",
      "secret":"MyKey",
      "exampleUrl":"http://miosito.it"
 });


 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];
 tokenManager.addRole(roles);


 // dictionary to encode inside token
 var toTokenize={
   "userId":"80248",
    "Other" : "........."
 };

 // now create a token of type  *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});


//create authenticated endpoints using checkAuthorization middleware
router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

// *************************************************************************
// this is an authenticated endpoint, accessible only by
// "admin, tokenTypeOne, TokenTypeTwo" tokens as described by the role
// {"URI":"/resource", "method":"GET","authToken":[admin,tokenTypeOne,TokenTypeTwo]}
// *************************************************************************

 });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // this is an authenticated API accessible only with "admin" tokens as described
    // by the role
    // {"URI":"/resource","method":"GET","authToken":[admin,tokenTypeOne,TokenTypeTwo]}
    // *********************************************************************************

  });

 router.delete("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This endpoint is unreachable due tokenManager.checkAuthorization respond with
    // Unauthorized 401 due no role set for DELETE "/resource"
    // *********************************************************************************
 });

// Unauthenticated endpoint
 router.put("/resource",function(req,res,next){

    // *********************************************************************************
    // this is an endpoint not authenticated so is reachable with or without token.
    // Through no role is set for PUT "/resource", an Unauthorized 401 response is
    // not sent due checkAuthorization middleware is not used, so it is an
    // unauthenticated endpoint
    // *********************************************************************************

 });

```

Be careful! The roles contained  in ```roles``` array **override** the ones previously defined for that resource.
This means that if you want to update a role list, you must call ```upgradeRole(roles)``` to add a role, 
and ```downgradeRole(roles)``` to remove a role.  



#### <a name="upgradeRoles"></a>`upgradeRole(roles)`
This function updates existing authorization roles, adding one or more roles.

The ```roles``` param is an array of role objects, defined as:

```javascript

 // *********************************************************************************
 //  updating a role where only  "tokenTypeOne, TokenTypeTwo" tokens type are
 //  authorized to access the resource  "/resource" called with method "GET"
 // *********************************************************************************
   {
     "URI":"/resource",
     "method":"GET",
     "authToken":[tokenTypeOne, TokenTypeTwo],
   }

```

where:
 * URI: URI of the resource to protect
 * method: HTTP method used to call the resource to protect
 * authToken : An array of Strings containing the token types authorized by this role


######Example of roles object:
```javascript
 // *********************************************************************************
 //  defining a roles where:
 //   1. Only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized to
 //      access the resource "/resource" called with method "GET".
 //   2. Only  "admin" tokens type are authorized to access the resource
 //      "/resource" called with method "POST"
 // *********************************************************************************
 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];

```

######Example of upgradeRole(roles) usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });


 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];
 tokenManager.addRole(roles);

 tokenManager.upgradeRole(
    { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}
 );


 // dictionary to encode inside token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // Create a *TokenTypeOne* that expire within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This is an authenticated endpoint accessible only with
    // "admin, tokenTypeOne, TokenTypeTwo" tokens as described in the role
    // {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]}
    // *********************************************************************************
  });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This is an authenticated API accessible with "newAdmin" and "admin" tokens as
    // described by the first and second role
    // { "URI":"/resource", "method":"POST",  "authToken":["admin"]}
    // { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}
    // *********************************************************************************

  });
```

#### <a name="downgradeRoles"></a>`downgradeRole(roles)`
This function updates existing authorization roles, removing one or more roles.

The ```roles``` param is an array of role objects, defined as:
```javascript

 // *********************************************************************************
 //  Updating a role where "tokenTypeOne, TokenTypeTwo" tokens type become not
 //  authorized to access the resource "/resource" called with method "GET"
 // *********************************************************************************
   {
     "URI":"/resource",
     "method":"GET",
     "authToken":["tokenTypeOne", "TokenTypeTwo"],
   }

```
where:
 * URI: URI of the resource to protect
 * method: HTTP method used to call the resource to protect
 * authToken : An array of Strings containing the token types authorized by this role


######Example of roles object:
```javascript

 // *********************************************************************************
 //  defining a roles where:
 //    1. Remove "tokenTypeOne, TokenTypeTwo" from tokens list authorized to access the
 //       resource "/resource" called with method "GET"
 //    2. Remove  "admin" from tokens type list are authorized to access the
 //       resource "/resource" called with method "POST"
 // *********************************************************************************
 var roles=[
    {"URI":"/resource","method":"GET","authToken":["tokenTypeOne","TokenTypeTwo"]},
    {"URI":"/resource","method":"POST","authToken":["admin"]}
 ];

```
######Example of downgradeRole(roles) usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
    {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    {"URI":"/resource","method":"POST","authToken":["admin","newAdmin"]}
 ];
 tokenManager.addRole(roles);

 tokenManager.downgradeRole({"URI":"/resource","method":"POST","authToken":["newAdmin"]});

 // dictionary to encode inside token
  var toTokenize={
    "userId":"80248",
    "Other" : "........."
  };

 // Create a *TokenTypeOne*  expiring within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){
    // *********************************************************************************
    // This is an authenticated endpoint accessible only with
    // "admin, tokenTypeOne, TokenTypeTwo" tokens as described in the role
    // {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]}
    // *********************************************************************************
 });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // *********************************************************************************
     // This is an authenticated API accessible only with "admin" tokens due
     // the first role
     // { "URI":"/resource", "method":"POST",  "authToken":["admin","newAdmin"]}
     // is downgraded by second role
     // { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}.
     // *********************************************************************************

  });
```


#### <a name="getRoles"></a>`getRoles()`
Gets the list of roles used by checkAuthorization middleware.

######Example of getRoles(roles) usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
              "decodedTokenFieldName":"UserToken",
              "secret":"MyKey",
              "exampleUrl":"http://miosito.it"
 });

 var roles= [
    { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    { "URI":"/resource", "method":"POST",  "authToken":["admin"]}
 ];
 tokenManager.addRole(roles);

 var rolesList= tokenManager.getRoles();

 console.log(rolesList) // print this:
                        // { "URI":"/resource","method":"GET", "authToken .......
                        // { "URI":"/resource", "method":"POST",  "authToken":["admin"]}

```


#### <a name="resetRoles"></a>`resetRoles()`
Resets authorization roles, erasing all of them

######Example of resetRoles(roles) usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
              "decodedTokenFieldName":"UserToken",
              "secret":"MyKey",
              "exampleUrl":"http://miosito.it"
 });

 var roles= [
    { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    { "URI":"/actions/resetRoles","method":"POST","authToken":["admin"]}
 ];

 // set roles
 tokenManager.addRole(roles);

 //reset roles
 tokenManager.resetRoles();

 // dictionary to encode inside token
 var toTokenize={
       "userId":"80248",
        "Other" : "........."
 };

 // now create a *TokenTypeOne* expiring within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This point is unreachable, because tokenManager.checkAuthorization responds with
    // Unauthorized 401. No role set for GET "/resource" because resetRoles()
    // resets the role dictionary
    // *********************************************************************************

  });

```

#### <a name="testAuth"></a>`testAuth(token, URI, method, callback)`
Tests the authorization roles, checking if a token type can access a resource.

Parameters:
 * token: token under test
 * URI: URI of the resource to protect
 * method: HTTP method used to call the resource to protect
 * callback: callback function "function(err,responseOBJ)" with two parameters:
    * err: HTTP error string, e.g. ```400, 401 ...``` or null if test passes 
    * responseOBJ:  response object. If test passes (err==null) contains decoded token information;
                    if test fails (err!=null), contains an object with ```error_message``` field explaining
                    test fail reason.


######Example of testAuth(token, URI, method, callback) usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });

 var roles= [
     { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
     { "URI":"/actions/resetRoles", "method":"POST",  "authToken":["admin"]}

 ];

 // set roles
 tokenManager.addRole(roles);

 // dictionary to encode inside token
 var toTokenize={
    "userId":"80248",
    "Other" : "........."
};

 // Create a *TokenTypeOne* that expiring in 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 //test if mytoken can access resource ""/resource" in get method
 tokenManager.testAuth(mytoken,"/resource","GET",function(err,response){

    if(err) ...... // test failed

    // if you are here test passed, so token is authorized.

    //......YOUR LOGIC ......
 });

```



## <a name="examples"></a>Examples

### <a name="locally"></a>tokenmanager is used locally in a monolithic application

In this example we are going to create: 
* ```Users.js``` to manage users and tokens
* ```Contents.js``` to manage contents
* ```test.js```, a script showing how simple is to manage tokens with tokenmanager package. 

######Example of Users.js:
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');

 tokenManager.configure( {
    "decodedTokenFieldName":"UserToken", // decoded token is added in UserToken field
    "secret":"MyKey",                    // secret key to encode/decode token
    "exampleUrl":"http://miosito.it"
 });

 // Set roles where only webUIToken token can call login resource and
 // admin, userTypeOne, userTypeTwo token can call get user by Id
 var roles= [
    { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
    { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
 ];

 // Set roles
 tokenManager.addRole(roles);

 router.get("/:id",tokenManager.checkAuthorization,function(req,res,next){

  // *********************************************************************************
  // Authenticated endpoints using checkAuthorization middleware
  // reachable only by admin, userTypeOne, userTypeTwo tokens as in set role
  // { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]}
  // *********************************************************************************

    // return User and unpack token
    res.status(200).send({User:...., unpackedToken:req.UserToken);

   });

  router.post("/login",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // reachable only by webUIToken tokens as in set role
    // { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
    // *********************************************************************************

    // Your Login Logic ....

    var user={ content:"info about logged user"};

    // User is logged, so POST must return a User token.
    // Now creating a userTypeOne token that expires within 1 hour.
    // To do this use tokenManager.encode.
    var token=tokenManager.encodeToken(user,"userTypeOne",{unit:"hours",value:1});

       res.status(200).send({access_token:token}); // return token
    });

```

######Example of Contents.js

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
    "decodedTokenFieldName":"UserToken", // add token in UserToken field
    "exampleUrl":"http://miosito.it"
 });

 // Set roles where only admin token can create contents and
 // admin, userTypeOne, userTypeTwo token can get all contents
 var roles= [
    {"URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
    {"URI":"/contents","method":"POST","authToken":["admin"]}
 ];

 // set roles
 tokenManager.addRole(roles);

 router.get("/contents",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // It is reachable only by admin, userTypeOne, userTypeTwo tokens as set in role
    // {"URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]}
    // *********************************************************************************

    // YOUR LOGIC ....

    res.status(200).send("YOUR DATA....");

   });

  router.post("/contents",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // It is reachable only by webUIToken tokens as set in role
    // { "URI":"/contents", "method":"POST",  "authToken":["admin"]}
    // *********************************************************************************

    // YOUR LOGIC ....

    // Save the resource
    var resource=new Resource(req.resource);

    res.status(200).send({createdResource:resource}); // return created resource
  });

```

The test script shows how to call both User and Contents services, which use tokenmanger to authenticate API.
To test the application, you can either this script or an API client like Postman.
The application runs on http://localhost:3000/

Steps:
   * create webUIToken. This step is mandatory to call user login
   * call the user login to get a user token as admin (because only admins can create contents)
   * create content as admin
   * read contents

```javascript

var request=require('request');
var tokenManager = require('tokenmanager');

tokenManager.configure( {
      "secret":"MyKey"  // secret key to encode/decode token
});

// As set in roles, we need admin token to create resource and a webUIToken to login
// admin user and get its token.
// webUIToken is needed so create this token expiring in 10 seconds
var webUIToken=tokenManager.encodeToken(
        {
            subject:"generate token on fly"},"webUIToken",{unit:"seconds",value:10
});

// request params
var rqparams = {
    url: 'http://localhost:3000/login',
    headers: {
            'Authorization': "Bearer " + webUIToken , // set Token
            'content-type': 'application/json'
    },
    body:JSON.stringify({username:"admin@admin.com",password:"admin"}); //login data
};

var adminToken;
// make a login request
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    adminToken=JSON.parse(body).access_token; // admin token is now set

});

// You have the token so you can create a content
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
        'Authorization': "Bearer " + adminToken , // set admin token
        'content-type': 'application/json'
    },
    body: JSON.stringify({... contents info ...}); // contents to create
};

// make a request to create content
request.post(rqparams, function (error, response, body) {
    if error console.log(error);
    console.log("Contents Created Successfully " + res.createdResource); // created resource
});

// now we can get contents with one of this tokens: 
// admin, userTypeOne, userTypeTwo
// so use admin token. I've already seen a previous login token

rqparams = {
    url: 'localhost:3000/contents',
    headers: {
    'Authorization': "Bearer " + adminToken , // set admin token
    },
};

// Make a request to get all contents
request.get(rqparams, function (error, response, body) {
if error console.log(error);    

    console.log("Contents: " + res.contents);
});

```


### <a name="microservices"></a>tokenmanger is used in a distributed architecture (e.g. using microservices)

Suppose we have three running microservices:
*   **authms** manages tokens for other microservices. running on http://authms.com
*   **userms** manages users. running on http://userms.com
*   **content** manage contents. running on http://contentms.com

authms could also be a third party service. This external service must have a POST endpoint, already described in
```checkAuthorization``` function.

######Example of authms
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken", // to add token in UserToken field
      "secret":"MyKey",                    // secret key to encode/decode token
      "exampleUrl":"http://miosito.it"
 });

 // set default roles for this ms. where only "msToken" 
 // token can access authms resources
 var roles= [
     {"URI":"/:id","method":"GET","authToken":[admin,userTypeOne,userTypeTwo]},
     {"URI":"/login","method":"POST","authToken":["webUIToken"]}
 ];

 // set roles
 tokenManager.addRole(roles);

 //create authenticated endpoints using checkAuthorization middleware
 //reachable only by "mstoken" tokens.

  
  router.post("/actions/createToken",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It encodes token and wraps tokenManager.encode function  
    // *********************************************************************************
        
    // YOUR LOGIC
        
    var token=tokenManager.encodeToken(req.toTokenize,req.tokenType,req.tokenLife);

    res.status(200).send({access_token:token});

   });

  
  router.post("/actions/addRole",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It adds token roles and wraps tokenManager.addRole function 
    // *********************************************************************************
                
    // YOUR LOGIC
        
    var token=tokenManager.addRole(req.roles);

   res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  });

  
  router.post("/actions/upgradeRole",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It upgrades token roles and wraps tokenManager.upgradeRole function
    // *********************************************************************************

    // YOUR LOGIC

    var token=tokenManager.addRole(req.roles);

    res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  }

  // It downgrades token roles and wraps tokenManager.downgradeRole function
  router.post("/actions/downgradeRole",tokenManager.checkAuthorization,function(req,res,next){
  
    // *********************************************************************************
    // It upgrade token roles and wrap tokenManager.upgradeRole function
    // *********************************************************************************

    // YOUR LOGIC
  
     var token=tokenManager.addRole(req.roles);

    res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  }

    //####################
    // Other Logic ......
    // .......
    //####################
 
   
   // *********************************************************************************
   // Endpoint that other microservice calls to encode and check token authorization
   // *********************************************************************************
   router.post("/checkAuthorization",tokenManager.checkAuthorization,function(req,res,next){

    var tokenToDecode=req.body.decode_token; // get token to decode
    var method=req.body.method; // get method
    var URI=req.body.URI; // get resource URI

    tokenManager.test(tokenToDecode,URI,method,function(err,retValue){
        if(err) return res.status(err).send(retValue);

        if (_.isUndefined(retValue.valid)) {
                return res.status(401).send(retValue);
        } else {
                if (retValue.valid == true) {
                    return res.status(200).send(retValue);
                } else {
                    return res.status(401).send(retValue);
                }
        }
    });

  });

```

######Example of userms

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 var request=require('request');

 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken", // Add token in UserToken field      
      "exampleUrl":"http://miosito.it",
      "authorizationMicroserviceUrl":"http://authms.com/checkAuthorization"
 });

 // set roles where only webUIToken token can call login resource and
 //  admin, userTypeOne, userTypeTwo token can call get user by id
 var roles= [
     { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
     { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
 ];

 // set roles calling msauth
  var rqparams = {
         url: 'http://authms.com/addRole',
         headers: {
                 'Authorization': "Bearer " + MyToken , // set Token
                 'content-type': 'application/json'
         },
         body: JSON.stringify(roles);
  };
  
 // Make request to set roles 
 request.post(rqparams, function (error, response, body) {
     if error console.log(error);

     // Here roles are set

 });

  
 router.get("/:id",tokenManager.checkAuthorization,function(req,res,next){

   // *********************************************************************************
   // Authenticated endpoints using checkAuthorization middleware
   // reachable only by admin, userTypeOne, userTypeTwo tokens
   // *********************************************************************************
    
   // YOUR LOGIC
   
   res.status(200).send({User:...., unpackedToken:req.UserToken); // return User and unpack token
   });

 router.post("/login",tokenManager.checkAuthorization,function(req,res,next){

   // *********************************************************************************
   // creates authenticated endpoints using checkAuthorization middleware
   // reachable only by webUIToken tokens   
   // *********************************************************************************
   
   // YOUR LOGIC TO LOGIN
   
   // User is logged so User token must be returned,
   // Now creates a "userTypeOne" token expiring within 1 hour.
   // using tokenManager.encode.

    // encode token calling msauth
    var rqparams = {
         url: 'http://authms.com/createToken',
         headers: {
                 'Authorization': "Bearer " + MyToken , // set Token
                 'content-type': 'application/json'
         },    
         body: JSON.stringify({"toTokenize":user,"tokenType":"user","tokenLife":{unit:"hours",value:1}});
    };
    
    // make a request to create roken and return it.
    request.post(rqparams, function (error, response, body) {
        res.status(200).send({access_token:JSON.parse(body).token}); // return access_token
     });
  });

```

######Example of contentms
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken", //  add token in UserToken field
          "authorizationMicroserviceUrl": "localhost:3000", // authms check Authorization url
          "exampleUrl":"http://miosito.it"
 });

 // set roles
 var roles= [
     { "URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
     { "URI":"/contents","method":"POST","authToken":["admin"]}
 ];

 // set roles calling msauth
 var rqparams = {
     url: 'http://authms.com/addRole',
     headers: {
             'Authorization': "Bearer " + MyToken , // set Token
             'content-type': 'application/json'
     },
     body: JSON.stringify(roles);
  };
 // Make a request to set Roles
 request.post(rqparams, function (error, response, body) {
     if error console.log(error);

    // here role are set
 });

  router.get("/contents",tokenManager.checkAuthorization,function(req,res,next){

        
    // *********************************************************************************
    // Authenticated endpoint using checkAuthorization middleware eachable only by:
    // admin, userTypeOne, userTypeTwo tokens
    // It gets all contents    
    // *********************************************************************************
    
    // YOUR LOGIC ... 
    
    res.status(200).send("YOUR DATA....");
   });

  //creates authenticated endpoints using checkAuthorization middleware
  //reachable only by webUIToken tokens
  router.post("/contents",tokenManager.checkAuthorization,function(req,res,next){
        
    // *********************************************************************************
    // Authenticated endpoint using checkAuthorization middleware reachable only by:
    // webUIToken tokens.
    // It creates a new content    
    // *********************************************************************************
        
    // YOUR LOGIC

    var resource=new Resource(req.resource);

    res.status(200).send({createdResource:resource});
  });

```

The test script shows how to call both User and Contents services, which use tokenmanger to authenticate API.
To test the application, you can either this script or an API client like Postman.
The application runs on http://localhost:3000/

Steps:
   * create webUIToken. This step is mandatory to call user login
   * call the user login to get a user token as admin (because only admins can create contents)
   * create content as admin
   * read contents
   
   
```javascript
var request=require('request');
var tokenManager = require('tokenmanager');

tokenManager.configure( {
          "secret":"MyKey"  // secret key to encode/decode token
});

// make admin login to get token.
// to make a login, webUIToken is needed, so create this token expiring in 10 seconds
var webUIToken=tokenManager.encodeToken(
    {subject:"generate token on fly"},"webUIToken",{unit:"seconds",value:10}
);

// Set login request to userms
var rqparams = {
    url: 'http://userms.com/login',
    headers: {
            'Authorization': "Bearer " + webUIToken , // set Token
            'content-type': 'application/json'
    },
    body: JSON.stringify({username:"admin@admin.com" , password:"admin"});
};

var adminToken;
// Make a login request
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    // set admin token to next calls to contentms
    adminToken=JSON.parse(body).access_token;

});

// now I have the token so I can create a content
// prepare reqest to create content using admin token
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
    'Authorization': "Bearer " + adminToken , // set admin token, webUIToken is not authorized
                'content-type': 'application/json'
    },
    body: JSON.stringify({... contents info ...});
};

// Make a request to create content
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    console.log("Contents Created Successfully " + res.createdResource);
});

// now I can get all contents with one of this tokens: admin, userTypeOne, userTypeTwo
// so use admin token. I've already seen a previous login token
// Set request
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
        'Authorization': "Bearer " + adminToken , // set admin token
    },
};

// Make a request to get all contents
request.get(rqparams, function (error, response, body) {
    if error console.log(error);

    console.log("Contents: " + res.contents);
});

```


License - "MIT License"
-----------------------

MIT License

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Author
------
CRS4 Microservice Core Team ([cmc.smartenv@crs4.it](mailto:cmc.smartenv@crs4.it))

Contributors
------
Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com))<br>
Guido Porruvecchio ([guido.porruvecchio@gmail.com](mailto:guido.porruvecchio@gmail.com))