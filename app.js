const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { redirect } = require("express/lib/response");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoDB");

const todoSchema = {
	name: {
		type: String,
		required: true,
	},
};

const Item = mongoose.model("Item", todoSchema);

const todo1 = new Item({
	name: "Welcome to your todo list!",
});

const todo2 = new Item({
	name: "Hit the + button to add a new item",
});

const todo3 = new Item({
	name: "<-- Check this box to delete the item",
});

const defaultTodos = [todo1, todo2, todo3];

app.get("/", function (req, res) {
	Item.find({}, function (err, items) {
		if (items.length == 0) {
			Item.insertMany(defaultTodos, function (err) {
				if (err) console.error(err);
				else {
					console.log("Default items inserted successfully!");
				}
				res.redirect("/");
			});
		} else {
			res.render("list", {
				listTitle: date.getDate(),
				newListItems: items,
			});
		}
	});
});

app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, result) {
		if (!err) {
			if (result) {
				res.render("list", {
					listTitle: _.capitalize(customListName),
					newListItems: result.items,
				});
			} else {
				// we create a new list item
				const list = new List({
					name: _.capitalize(customListName),
					items: defaultTodos,
				});

				list.save();

				res.redirect("/" + customListName);
			}
		}
	});
});

const listSchema = {
	name: String,
	items: [todoSchema],
};

const List = mongoose.model("List", listSchema);

app.post("/", function (req, res) {
	const item = req.body.newItem;
	const listTitle = req.body.list;
	console.log(listTitle);
	const newItem = new Item({
		name: item,
	});
	if (listTitle === date.getDate()) {
		newItem.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listTitle }, function (err, foundList) {
			foundList.items.push(newItem);
			foundList.save();
			res.redirect("/" + listTitle);
		});
	}
});

app.post("/delete", function (req, res) {
	const checkedTodoId = req.body.checkbox;
	const listTitle = req.body.listTitle;

	if (listTitle === date.getDate()) {
		Item.findByIdAndRemove(checkedTodoId, function (err) {
			if (err) console.error(err);
			else console.log("Item deleted successfully!");
			res.redirect("/");
		});
	} else {
		List.findOneAndUpdate(
			{ name: listTitle },
			{ $pull: { items: { _id: checkedTodoId } } },
			function (err, results) {
				res.redirect("/" + listTitle);
			}
		);
	}
});

app.get("/about", function (req, res) {
	res.render("about");
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
