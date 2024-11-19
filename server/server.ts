import express from 'express';
import { json } from 'body-parser';
import { UserController } from '../controllers/user.controller';

const app = express();
app.use(json());

// Define routes
app.post('/users', UserController.createUser);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

//Hello World
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
