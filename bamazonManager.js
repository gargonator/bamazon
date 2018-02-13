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

// array of manager options
var options = [
	'View Products for Sale',
	'View Low Inventory',
	'Add to Inventory',
	'Add New Product'];

// inventory value that is considered 'low'
var inventoryThreshold = 50;

// initialize askManager script
askManager();

// allows managers to view products for sale, view low inventory, add to inventory, and 
// add new products
function askManager() {
	console.log();
	inquirer.prompt([{
		type: 'list',
		name: 'option',
		message: 'What would you like to do?',
		choices: options
	}]).then(function(answer) {
		switch(answer.option) {
			case 'View Products for Sale':
				displayProducts();
				break;
			case 'View Low Inventory':
				viewLowInventory();
				break;
			case 'Add to Inventory':
				addToInventory();
				break;
			case 'Add New Product':
				addNewProduct();
				break;
			default:
				console.log('Sorry, something went wrong. Try again.');
		}
	})
}

// display all products currently for sale
function displayProducts() {
	connection.query(`SELECT * FROM products`, (err, results) => {
		if (err) throw err;
		console.table('',results);
		});
	setTimeout(() => askManager(), 1000);
}

// view data for products that have low stock quantity
function viewLowInventory() {
	connection.query(`SELECT item_id, product_name, stock_quantity FROM products 
	WHERE stock_quantity <= ${inventoryThreshold}`, (err, results) => {
		if (err) throw err;
		if (results.length === 0) {
			console.log('\nInventory levels for all products are OK.');
			setTimeout(() => askManager(), 1000);
		} else {
			console.log('\nThe following products have low inventory, consider replenishing:\n');
			console.table(results);
			setTimeout(() => askManager(), 1000);
		}
	})
}

// add more of an existing product to inventory
function addToInventory() {
	connection.query(`SELECT * FROM products`, (err, results) => {
		if (err) throw err;
		console.table('',results);
		inquirer.prompt([{
			type: 'input',
			name: 'id',
			message: 'What is the ID of the product you\'d like to replenish?'
		}]).then((answer) => {
			var product_id = answer.id;
			connection.query(`SELECT stock_quantity FROM products WHERE item_id = ${answer.id}`,
				(err, results) => {
					if (err || results.length === 0) {
						console.log('\nWe don\'t carry that product. Select something else.');
						setTimeout(() => addToInventory(), 1000);
					} else {
						var quantityRemaining = results[0].stock_quantity;
						inquirer.prompt([{
							type: 'input',
							name: 'quantity',
							message: 'How many units would you like to add?'
						}]).then((answer) => {
							// var newQuantity = quantityRemaning + parseInt(answer.quantity);
							connection.query(`UPDATE products SET stock_quantity = ? WHERE item_id = ${product_id}`,
								[quantityRemaining + parseInt(answer.quantity)], (err, results) => {
									if (err) {
										console.log('\nSomething went wrong. Try again.');
										setTimeout(() => addToInventory(), 1000);
									} else {
										console.log('\nInventory successfully updated!')
										setTimeout(() => askManager(), 1000);
									}
								})
						})
					}
				})
		})
	});
}

// add a net new product to inventory
function addNewProduct() {
	inquirer.prompt([{
	type: 'input',
	name: 'id',
	message: 'What is the unique ID of the product you want to add?'
		}]).then((answer) => {
	var item_id = parseInt(answer.id);
	inquirer.prompt([{
		type: 'input',
		name: 'name',
		message: 'What is the product name?'
	}]).then((answer) => {
		var product_name = answer.name;
		inquirer.prompt([{
			type: 'input',
			name: 'dept',
			message: 'What department is it in?'
		}]).then((answer) => {
			var department_name = answer.dept;
			inquirer.prompt([{
				type: 'input',
				name: 'price',
				message: 'What is is the price?'
			}]).then((answer) => {
				var price = parseInt(answer.price);
				inquirer.prompt([{
					type: 'input',
					name: 'quantity',
					message: 'What is is initial stock?'
				}]).then((answer) => {
					var stock_quantity = parseInt(answer.quantity);
					// do type checks to make sure input is valid
					if (typeof item_id != 'number' || typeof price != 'number' || typeof stock_quantity != 'number' || typeof product_name != 'string' || typeof department_name != 'string') {
						console.log('\nYour inputs are not in the right format. Try again.')
						setTimeout(() => addNewProduct(), 1000);;
					} else {
						var newRow = {
							item_id: item_id,
							product_name: product_name,
							department_name: department_name,
							price: price,
							stock_quantity: stock_quantity
						};
						connection.query('INSERT INTO products SET ?',newRow, (err, results) => {
							if (err) throw err;
							console.log('\nProduct added!\n')
							setTimeout(() => askManager(), 1000);
						})
					}
				})
			})
		})
	})
})
}
