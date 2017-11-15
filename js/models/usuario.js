let SQLHelper = require('../server_side/sql-helper.js');
let TYPES = require('tedious').TYPES;
const SqlConnection = require("tedious").Connection;
const Request = require("tedious").Request;
const moment = require('moment')
let connection = null;

const session = require('electron').session

var Usuario = {
    login: function (nombreUsuario, contraseña) {
        let mainSession = mainWindow.webContents.session
        //let cookies = [];
        let isSessionFinish = false;

        let currentDate = moment().unix();
        let expirationDate = moment().hours(6).unix()

        mainSession.cookies.get({name: nombreUsuario}, (error, cookies) => {
            if(cookies.length > 0) {
                if(cookies[0].expirationDate >= currentDate){
                    isSessionFinish = true;
                }
            }
        })
        
        if(!isSessionFinish){
            mainSession.cookies.set({
                name: nombreUsuario,
                value: nombreUsuario,
                expirationDate: expirationDate
            })
        }


        //Create SQL Connection
        SQLHelper.createConnection();

        var arr = [];
        var query = 'SELECT * FROM [Entidad].[Usuario] WHERE usuario = @usuario';
        
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('usuario', nombreUsuario, TYPES.VarChar));
        
        return SQLHelper.executeStatement(query, false);        
    },

    createEmployeeUser: function(name, email, userName, password) {
        //Create SQL Connection
        SQLHelper.createConnection();
        var query = 'servidor.CrearEmpleado'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('nombre', name, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('correoElectronico', email, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('usuario', userName, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('contraseña', password, TYPES.VarChar));
        return SQLHelper.executeStatement(query, true);  
    }
}

module.exports = Usuario;