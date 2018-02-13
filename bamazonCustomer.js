const inquirer = require('inquirer');
const table = require('console.table');
const mysql = require('mysql');

// create connection object to connect to mysql server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'bamazon'
});

// connect to the mysql server on local machine
connection.connect((err) => {if (err) throw err});

// display current product inventory and starts the user prompt
connection.query(`SELECT item_id,product_name,price FROM products`, (err, results) => {
	if (err) throw err;
	console.table(results);
	askUser();
});

// asks user for id and quantity of product they would like to purchase
// displays total order price for successful orders, or stock out message if there are not
// enough units in stock
function askUser() {
	inquirer.prompt([{
		type: 'input',
		name: 'id',
		message: 'Please enter the ID of the product you\'d like to purchase'
	}]).then((answer) => {
		connection.query(`SELECT item_id FROM products WHERE item_id = ${answer.id}`, (err, results) => {
			if (err || results.length === 0) {
				console.log('Sorry, we do not carry that product. Select a new product.\n');
				askUser();
			} else {
				var product_id = answer.id; // store product id
				inquirer.prompt([{
					type: 'input',
					name: 'quantity',
					message: 'How many units would you like to purchase?'
				}]).then((answer) => {
					var quantityRequested = answer.quantity;
					connection.query(`SELECT stock_quantity FROM products WHERE item_id = ${product_id}`, (err, results) => {
						if (err) {
							askUser();
						}
						if (answer.quantity > results[0].stock_quantity) {
							console.log('Sorry, not enough product in stock.');
							askUser();
						} else {
							connection.query(`UPDATE products SET stock_quantity = ? WHERE item_id = ${product_id}`,
								[results[0].stock_quantity - answer.quantity], (err, results => {
									if (err) throw err;
									connection.query(`SELECT price FROM products WHERE item_id = ${product_id}`, (err, results) => {
										if (err) throw err;
										var cost = quantityRequested*results[0].price;
										console.log('Order successfully submitted.');
										console.log('Your total comes out to $' + cost + '.');
										askUser();
									})
								}))
						}
					})
				})
			}
		})
	})
}