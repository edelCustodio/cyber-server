let SQLHelper = require('../server_side/sql-helper.js');
let TYPES = require('tedious').TYPES;

var Producto = {
    getProducts: function() {
        SQLHelper.createConnection();
        var query = 'SELECT * FROM [Catalogo].[Producto]'
        SQLHelper.clearSqlParameters();
        return SQLHelper.executeStatement(query, false);  
    }
}

module.exports = Producto