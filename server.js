const dotenv = require("dotenv");
dotenv.config({ path: './config.env' });
const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const PORT = process.env.PORT || 8080;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// Call the connectDB function to establish the MongoDB connection







//schema
const itemsSchema = {
    name: String
}

//model
const Item = mongoose.model("item",itemsSchema);
 
//creating documents
const item1 = new Item({
    name: "Welcome to your todoList!"
})

const item2 = new Item({
    name: "Hit the + button to add a new item."
})

const item3 = new Item({
    name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/",function (req,res)
{ 
    Item.find({})
        .then(foundItems => {
            if(foundItems.length === 0){
                //insert
                Item.insertMany(defaultItems)
                      .then(function () {
                        console.log("Successfully saved defult items to DB");
                      })
                      .catch(function (err) {
                        console.log(err);
                      });
                      res.redirect("/");
            } else {
                res.render("list",{listTitle: "Today", newListItems: foundItems});        
            }
        
    })
    .catch(err => {
        console.log(err);
    })
});
app.post("/",function(req,res)
{
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    
    if (listName === "Today") {
        item.save();
        res.redirect("/");    
    } else {
        List.findOne({name: listName})
            .then(foundList => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+ listName)
            })
            .catch(function (err) {
                console.log(err);
              });
    }

    
    
});
app.post("/delete", function(req,res){
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItem)
        .then(function(){
            console.log("Succesfully deleted");
            res.redirect("/");
        })
        .catch(function (err) {
            console.log(err);
        });    
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItem}}})
        .then(foundList => {
            res.redirect("/"+listName);
        })
        .catch(function (err){
            console.log(err);
        });
    }

    
})

app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(foundList => {
        if(!foundList){
            //create a new list
            const list = new List(
                {
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+ customListName);
        } else {
            //show an existing list
            res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
        }
    })
    .catch(function (err){
        console.log(err);
    });
    
})

app.get("/work",function(req,res){
    res.render("list",{listTitle: "work List",newListItems: workItems});
});
app.get("/about",function(req,res){
    res.render("about");
})

app.post("/work",function(req,res){
    let item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
});


// let port = process.env.PORT;
// if (port == null || port == "") {
//  port = 3000;
// }
// app.listen(port, function() {
//  console.log("Server started successfully");
// });
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('Listening on port ${PORT}');
    })
});
//https://cloud.mongodb.com/v2/64af4c4bd2813007c5c9cfc1#/metrics/replicaSet/64b00804bb23db4b87c6bcb3/explorer/todolistDB