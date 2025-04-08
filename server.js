const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser")
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;

// Increase request size limit
app.use(bodyParser.json({ limit: "50mb" }));  // Increase JSON payload limit
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // Increase URL-encoded payload limit

// Middleware
app.use(express.json());  // To parse JSON request body
app.use(cors({ origin: '*'}));  // To allow cross-origin requests

// use multer for multipart/form-data
const storage = multer.memoryStorage(); // or diskStorage if saving files
const upload = multer({ storage });

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '9806714040',
    database: 'Rental',
    port: 3306
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to the database:', err.stack);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// 📝 User Registration API
app.post('/register', async (req, res) => {
    const { userName, email, password } = req.body;

    console.log("\nRegister api called")

    if (!userName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: "Database error" });
            }
            
            if (results.length > 0) {
                console.log('User already exists');
                return res.status(400).json({ error: "User already exists" });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into database
            db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [userName, email, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Error inserting user:', err);
                        return res.status(500).json({ error: "Database error" });
                    }
                    res.status(201).json({ message: "User registered successfully" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// **User Login API**
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log("\nLogin api called")

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        //Secret key which is used in making the token by the jwt function which is used to verify the user
        const SECRET_KEY = "Rental";

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1111h" });

        console.log("User logged in successfully");
        console.log("Token:", token);

        return res.status(200).json({ 
            success: true, token: token, message: " User logged in successfully!" 
        });
    });
});

app.get('/user', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    console.log("\nuser api called")

    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    try{
        const SECRET_KEY = "Rental";

        //Here decoded with have the user data in the form of object which was used to encrypt the token
        const decoded = jwt.verify(token, SECRET_KEY);

        db.query('SELECT id, name, phone, image, email FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const user = results[0];
            console.log("User found:", user);
            res.status(200).json({ user, success: true });
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Invalid token" });
    }

});

// Retriving user data for the profile page
app.get('/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    console.log("\nProfile api called")

    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    try {
        const SECRET_KEY = "Rental";
        const decoded = jwt.verify(token, SECRET_KEY);

        db.query('SELECT name, email, created_at, image, role FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const user = results[0];
            console.log("User found:", user.name, user.email);
            res.status(200).json({ user, success: true });
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
});

app.post('/updateUserDetails', async (req, res) => {
    const { name, email, number, password, image } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    console.log("\nUpdate user details API called");

    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    try {
        const SECRET_KEY = "Rental";
        const decoded = jwt.verify(token, SECRET_KEY);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user details in the database
        db.query('UPDATE users SET name = ?, email = ?, phone = ?, password = ?, image = ? WHERE id = ?',
            [name, email, number, hashedPassword, image, decoded.id],
            async (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    return res.status(500).json({ error: "Database error" });
                }

                // After updating, issue a new token with the updated user data
                const newToken = jwt.sign({ userId: decoded.id, email: email }, SECRET_KEY, { expiresIn: '1111h' });

                res.status(200).json({
                    success: true,
                    message: "User details updated successfully",
                    token: newToken, // Return the new token
                    email: email
                });
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
});

// This is the RIGHT way to handle multipart/form-data
app.post('/addCar', upload.single('image'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { brand, model, year, location, price } = req.body;
    const image = req.file;
   
    console.log("\nAdd car API called");

    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    try {

        const SECRET_KEY = "Rental";
        const decoded = jwt.verify(token, SECRET_KEY);

        db.query(
            'INSERT INTO cars (brand, model_name, year, location, price_per_day, image, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [brand, model, year, location, price, image.buffer, decoded.id],
            (err, result) => {
                if (err) {
                    console.error('Error inserting car:', err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(201).json({ message: "Car added successfully" });
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
});


app.get('/profile/mycarlists', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const SECRET_KEY = "Rental";

    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }

    console.log("\nVehicle listing API called");

    const query = `
        SELECT users.name, users.email, cars.image, cars.brand, cars.location
        FROM cars
        JOIN users ON cars.owner_id = users.id
        WHERE users.id = ?
    `;

    db.query(query, [decoded.id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: "Database error" });
        }

        res.status(200).json(results); // send the array directly
    });
});


// 🚀 Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


