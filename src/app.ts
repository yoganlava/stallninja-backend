import { UserController } from './modules/user/user.controller';
import express from 'express';
import UserService from './modules/user/user.service';
import { createConnection } from 'typeorm';
import bodyparser from 'body-parser';

var user_service = new UserService();
const app = express();

const controllers = [
    new UserController(user_service)
]

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyparser.json()); 

app.use(bodyparser.urlencoded({ extended: true })); 

controllers.forEach((controller) => {
    app.use(controller.path, controller.router);
});

createConnection();

app.listen(3000, "0.0.0.0" , () => console.log("Server started"));
// app.listen(3001, () => console.log("Server started"));