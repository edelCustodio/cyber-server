let SQLHelper = require('../server_side/sql-helper.js');
let TYPES = require('tedious').TYPES;

var Usuario = {
    login: function (username, pass) {        
        return this.getUserInfoByUserName(username)
    },

    createEmployeeUser: function(name, email, userName, password) {
        //Create SQL Connection
        SQLHelper.createConnection();
        var query = 'servidor.CrearEmpleado'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('nombreCompleto', name, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('correoElectronico', email, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('usuario', userName, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('contraseña', password, TYPES.VarChar));
        return SQLHelper.executeStatement(query, true);  
    },

    getUserByUsername: function(username){

        SQLHelper.createConnection();
        var query = 'SELECT idUsuario FROM [Entidad].[Usuario] WHERE usuario = @username'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('username', username, TYPES.VarChar));
        return SQLHelper.executeStatement(query, false);  
    },

    getUserByEmail: function(email){

        SQLHelper.createConnection();
        var query = 'SELECT idUsuario FROM [Entidad].[Usuario] WHERE correoElectronico = @email'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('email', email, TYPES.VarChar));
        return SQLHelper.executeStatement(query, false);  
    },

    validateIfUserExist: function(username, email){

        SQLHelper.createConnection();
        var query = 'SELECT idUsuario FROM [Entidad].[Usuario] WHERE (usuario = @username OR correoElectronico = @email)'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('username', username, TYPES.VarChar));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('email', email, TYPES.VarChar));
        return SQLHelper.executeStatement(query, false);  
    },

    getUserInfoByUserName: function (username) {
        SQLHelper.createConnection();
        var query = 'SELECT * FROM [Entidad].[Usuario] WHERE usuario = @username'
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('username', username, TYPES.VarChar));
        return SQLHelper.executeStatement(query, false);  
    },

    createUserSession: function(idUsuario, fechaInicio) {
        SQLHelper.createConnection();
        var query = "servidor.GuardarRegistroSesion"
        SQLHelper.clearSqlParameters();
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('idUsuario', idUsuario, TYPES.Int));
        SQLHelper.addSqlParameter(SQLHelper.sqlParameter('fechaInicio', fechaInicio, TYPES.DateTime));
        return SQLHelper.executeStatement(query, true);  
    }
}

module.exports = Usuario;