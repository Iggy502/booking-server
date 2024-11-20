import 'reflect-metadata';
import express from 'express';
import {json} from 'body-parser';
import {container} from 'tsyringe';
import {UserController} from '../controllers/user.controller';

const app = express();
app.use(json());

// Define routes
const userController = container.resolve(UserController);
app.use('/users', userController.routes());

//Hello World
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
