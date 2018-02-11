const mysql = require('mysql');
const fs = require('fs');
const table = require('console.table')

// connect to the mysql server on local machine
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'bamazon'
});

connection.connect((err) => {if (err) throw err});

// create table and populate with rows
connection.query('USE bamazon', (err, results) => {
	if (err) throw err;
	connection.query('DROP TABLE IF EXISTS products', (err, results) => {
		if (err) throw err;
		connection.query(
		`CREATE TABLE products (
			item_id INT,
			product_name VARCHAR(50),
			department_name VARCHAR(50),
			price INT,
			stock_quantity INT,
			PRIMARY KEY (item_id)
		)`, (err, results) => {
			if (err) throw err;
			insertData('inventory.csv');
			setTimeout(() => displayTable('products'),
					1000);
		});
	});	
});


// ---------------------------------------------------- //
// Helper functions


function insertData(filename) {
	fs.readFile(filename, 'utf8', (err, data) => {
		if (err) throw err;
		// convert csv to array of arrays, each array element represents table row
		var inventory = data
			.split('\r')
			.map((row) => row.split(','))
			.map((row,index) => {
				if (index != 0) {
					return parseRow(row);
				} else {
					return row;
				}
			});
		
		// add rows to products database
		inventory.forEach((row,index) => {
			if (index != 0) {
				rowObject = {item_id: row[0], product_name: row[1], department_name: row[2], 
					price: row[3], stock_quantity: row[4]}
				connection.query(`INSERT INTO products SET ?`, rowObject, (err, results) => {
					if (err) throw err;
				});
			}
		});

		// converts appopriate fields from strings to integers
		function parseRow(row) {
			return row.map((cell,index) => {
				if (index === 0 || index === 3 || index === 4) {
					return parseInt(cell);
				} else {
					return cell;
				}
			})
		}
	})
}

function displayTable(table) {
	connection.query(`SELECT * from ${table}`, (err, results) => {
		if (err) throw err;
		console.log('\nInventory stocked!\n')
		console.table(results);
		connection.end();
	});
}

