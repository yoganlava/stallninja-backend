import express from 'express';
import UserService from './user.service';

export class UserController {
    public path = "/user"
    public router = express.Router();
    private userService: UserService;


    public constructor(userService: UserService){
        this.userService = userService;
        this.initialiseRoutes();
    }

    private initialiseRoutes() {
        this.router.post('/getuser', async (req, res) => {
            return res.send(await this.userService.getUser(req.body.token));
        });
        this.router.post('/login', async (req, res) => {
            return res.send(await this.userService.login(req.body.username, req.body.password));
        });
        this.router.post('/register', async (req, res) => {
            return res.send(await this.userService.register(req.body.username, req.body.email, req.body.password));
        });
        this.router.post('/logout', async (req, res) => {
            return res.send(await this.userService.logout(req.body.token));
        });
        this.router.post('/request', async (req, res) => {
            return res.send(await this.userService.requestForgot(req.body.email));
        });
        this.router.post('/reqver', async (req, res) => {
            return res.send(await this.userService.requestVerify(req.body.email));
        });
        this.router.post('/verify', async (req, res) => {
            return res.send(await this.userService.verifyEmail(req.body.token));
        });
        this.router.post('/change', async (req, res) => {
            return res.send(await this.userService.changePassword(req.body.password, req.body.token));
        });
        this.router.post('/changecurrent', async (req, res) => {
            return res.send(await this.userService.changeCurrentPassword(req.body.currPassword, req.body.newPassword, req.body.token));
        });
        this.router.post('/createrole', async (req, res) => {
            return res.send(await this.userService.createRole(req.body.token, req.body.name, parseInt(req.body.clothing), parseInt(req.body.nation)));
        });
        this.router.post('/getrole', async (req, res) => {
            return res.send(await this.userService.getRole(req.body.token));
        });
    }
}