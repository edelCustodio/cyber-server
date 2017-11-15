let express = require('express')
let bodyParser = require("body-parser")
let app = express()
let usuario = require('../models/usuario')
let bcrypt = require('bcrypt-nodejs')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/login', function(req, res){
    var user = req.body.user;
    var password = req.body.pass;
    usuario.login(user, password).then(function(response){
        res.json(response);
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

app.listen(6868, function(){

})