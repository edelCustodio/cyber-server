let express = require('express')
let bodyParser = require("body-parser")
let app = express()
let usuario = require('../models/usuario')
let bcrypt = require('bcrypt-nodejs')
const moment = require('moment')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/login', function(req, res){
    var user = req.body.user;
    var pass = req.body.pass;
    usuario.login(user, pass).then(function (val) {
        var password = val.contraseña.value;
        var idUsuario = val.idUsuario.value;
        let currentDate = moment();
        
        let expirationDate = moment().hours(6).unix()

        bcrypt.compare(pass, password, function(err, result) {
            // res == true
            if(result) {        
                usuario.createUserSession(idUsuario, new Date()).then((sessionResult) => {
                    if(sessionResult) {

                        res.json(true);
                    }
                })
                
                console.log(res);
            }else{
                console.log(err);
            }
           
        });
        
    });
  
})

app.post('/createEmployee', function(req, res){
    var name = req.body.name
    var email = req.body.email
    var user = req.body.user;
    var password = req.body.pass;

    var hashPass = bcrypt.hashSync(password);

    usuario.createEmployeeUser(name, email, user, hashPass).then(function(response){
        res.json(response);
    });
})

app.get('/getUserByUsername', function(req, res) {
    var user = req.query.user

    usuario.getUserByUsername(user).then(function(response){
        res.json(response);
    });
})

app.get('/getUserByEmail', function(req, res) {
    var email = req.query.email

    usuario.getUserByEmail(email).then(function(response){
        res.json(response);
    });
})

app.get('/validateIfUserExist', function(req, res) {
    var user = req.query.user
    var email = req.query.email

    usuario.validateIfUserExist(user, email).then(function(response){
        res.json(response);
    });
})

app.get('/getUserInfoByUserName', function(req, res) {
    var user = req.query.user

    usuario.getUserInfoByUserName(user).then(function(response){
        res.json(response);
    });
})

app.listen(6868)