// Importing the Libraries Required
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const connectDB = require('./config/db');
const User = require('./models/userModel'); // Your Mongoose model
const Product = require('./models/productModel');
const { isValidPassword, generateOtp } = require('./utils');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Connect to MongoDB before starting server
connectDB().catch(err => {
    console.error("Failed to connect to MongoDB:", err);
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// app.use for loading json and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Set the views directory explicitly
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

// Setup session middleware (you should do this in your main app.js or index.js)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Middleware to ensure MongoDB connection before handling requests (for serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error in middleware:', error);
        res.status(500).send('Database connection failed');
    }
});

// Middleware to check admin authentication
const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/adminLogin');
    }
};
// PayPal Credentials (replace with your actual credentials)
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_API_URL;

//GET Request Routes
app.get('/', (req, res) => {
    res.render('landingPage')
})
app.get('/signup', (req, res) => {
    res.render('userSignup', { error: null })
})
app.get('/login', (req, res) => {
    res.render('userLogin', { error: null })
})
app.get('/verifyotp', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signup');
    }

    res.render('verifyotp', { error: null }); // Render with no error initially
});
app.get('/leaderboard', isLoggedIn, async (req, res) => {
    const users = await User.find().sort({ totalCarbonFootprint: -1 });
    const user = await User.findOne({ email: req.user.email })
    // Check if user and user.cart exist
    let count = 0;
    if (user && Array.isArray(user.cart)) {
        count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
    }
    res.render('leaderboard', { users, count });
})
app.get('/resendotp', async (req, res) => {
    const sessionUser = req.session.user;

    if (!sessionUser || !sessionUser.email) {
        return res.status(401).send("User session not found.");
    }

    const email = sessionUser.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Generate new OTP
        const otp = generateOtp();

        // Update in DB
        await User.updateOne(
            { email },
            { $set: { otp, verified: false } }
        );

        // Send OTP via email
        await sendOtp(email, otp);

        // Redirect to verify OTP page with message
        res.redirect('/verifyotp');
    } catch (error) {
        console.error("Error in /resendotp:", error);
        res.status(500).send("Something went wrong.");
    }
});
app.get('/home', isLoggedIn, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        const user = await User.findOne({ email: req.user.email });

        // Check if user and user.cart exist
        let count = 0;
        if (user && Array.isArray(user.cart)) {
            count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
        }

        res.render('userHome', { products, count });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});
app.get('/adminLogin', (req, res) => {
    res.render('adminLogin', { error: null })
})

// Admin Panel Routes
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    const cprod = await Product.countDocuments({});
    const cUser = await User.countDocuments({});
    let carbons = 0;

    const products = await Product.find({}); // Get all products

    products.forEach(product => {
        carbons += product.carbonFootprint || 0; // Add carbonFootprint, handle undefined/null
    });

    const users = await User.find({ 'purchased.0': { $exists: true } }) // only users with purchases
        .populate('purchased.product', 'name') // populate product name only
        .select('fullname purchased') // fetch only what's needed
        .lean();

    // flattening for easier rendering
    const recentPurchases = [];
    users.forEach(user => {
        user.purchased.forEach(purchase => {
            if (purchase.product) {
                recentPurchases.push({
                    username: user.fullname,
                    productName: purchase.product.name,
                    purchasedAt: purchase.purchasedAt
                });
            }
        });
    });

    // Sort by recent date (optional)
    recentPurchases.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

    console.log("Total Products:", cprod);
    console.log("Total Users:", cUser);
    console.log("Total Carbon Footprint:", carbons);
    return res.render('admin/dashboard', { cprod, cUser, carbons, recentPurchases})

});

app.get('/admin/products/add', isAdmin, (req, res) => {
    res.render('admin/add-product');
});

app.get('/analytics', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ email: req.user.email }).populate('cart.product');
    // Check if user and user.cart exist
    let count = 0;
    if (user && Array.isArray(user.cart)) {
        count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
    } res.render('analytics', { count })
})
// controllers/cartController.js or inside your routes
app.get('/cart', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).populate('cart.product');
        // Check if user and user.cart exist
        let count = 0;
        if (user && Array.isArray(user.cart)) {
            count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
        }
        res.render('cart', { cartItems: user.cart, count });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching cart");
    }
});

app.post('/cart/remove', isLoggedIn, async (req, res) => {
    const { productId } = req.body;
    await User.updateOne(
        { email: req.user.email },
        { $pull: { cart: { product: productId } } }
    );
    res.redirect('/cart');
});


app.post('/admin/products', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, material, type, price } = req.body;
        let imageUrl = '';

        // Upload image to Cloudinary if a file was provided
        if (req.file) {
            // Convert buffer to base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'auto',
                folder: 'webdash_products'
            });
            imageUrl = result.secure_url;
        }

        const product = new Product({
            name,
            material,
            type,
            image: imageUrl,
            price: parseFloat(price)
        });

        await product.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send('Error creating product');
    }
});

app.get('/admin/products', isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/products-list', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});
app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    const userC = await User.findOne({ email: req.user.email }).populate('cart.product');
    const userP = await User.findOne({ email: req.user.email }).populate('purchased.product');
    // Check if user and user.cart exist
    let count = 0;
    if (user && Array.isArray(user.cart)) {
        count = user.cart.reduce((total, item) => total + (item.quantity || 0), 0);
    }
    res.render('profile', { user, count, cartItems: userC.cart, purchasedItems: userP.purchased })
})

//POST Requests Routes


// Send OTP using nodemailer
async function sendOtp(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: '"ReVibe" <${process.env.EMAIL_USER}>',
        to: email,
        subject: 'Verify your OTP',
        text: `Your OTP is ${otp}`
    });
}

app.post('/signup', async (req, res) => {
    const { fullname, email, contact, password } = req.body;
    const confirmPassword = req.body['confirm-password'];

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.redirect('/login');

        if (!email.endsWith('@gmail.com') && !email.endsWith('@outlook.com')) {
            return res.render('userSignup', { error: 'Only Gmail or Outlook emails are allowed.' });
        }

        if (!/^\d{10}$/.test(contact)) {
            return res.render('userSignup', { error: 'Contact number must be exactly 10 digits.' });
        }

        if (password !== confirmPassword) {
            return res.render('userSignup', { error: 'Passwords do not match.' });
        }

        // Hash password properly using await
        const salt = await bcrypt.genSalt(10);
        console.log("Salt:", salt);

        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("Hashed: ", hashedPassword)

        const otp = generateOtp();

        const newUser = new User({
            fullname,
            email,
            contact,
            password: hashedPassword,
            otp
        });

        await newUser.save();
        await sendOtp(email, otp);

        req.session.user = {
            fullname,
            email,
            contact
        };

        res.redirect('/verifyotp');
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).send("Something went wrong during signup.");
    }
});

app.post('/verifyotp', async (req, res) => {
    const userSession = req.session.user;

    if (!userSession) {
        return res.redirect('/signup', { error: null });
    }

    const email = userSession.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('verifyotp', { error: "User not found.", message: null });
        }

        const enteredOtp = [
            req.body.otp1 || '',
            req.body.otp2 || '',
            req.body.otp3 || '',
            req.body.otp4 || '',
            req.body.otp5 || '',
            req.body.otp6 || ''
        ].join('');

        if (user.otp === enteredOtp) {
            await User.updateOne({ email }, { $set: { verified: true } });

            // Create session
        req.session.user = {
            userId: user._id,
            email: user.email,
            fullname: user.fullname
        };

        // Generate JWT token
        const token = jwt.sign({
            userId: user._id,
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set both session and cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('Session and cookie set for user:', user.email);

            return res.redirect('/home'); // Or wherever you want to redirect after successful OTP verification
        } else {
            return res.render('verifyotp', { error: "Invalid OTP entered.", message: null });
        }
    } catch (err) {
        console.error("OTP Verification Error:", err);
        res.render('verifyotp', { error: "Something went wrong.", message: null });
    }
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        if (!user.verified) {
            console.log('User not verified');
            return res.redirect('/resendotp');
        }

        // Create session
        req.session.user = {
            userId: user._id,
            email: user.email,
            fullname: user.fullname
        };

        // Generate JWT token
        const token = jwt.sign({
            userId: user._id,
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set both session and cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('Session and cookie set for user:', user.email);
        res.redirect('/home');
    } catch (err) {
        console.error('Login error:', err);
        res.render('userLogin', { error: 'Something went wrong. Please try again.' });
    }
});

app.post('/adminLogin', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (email == 'admin@admin.com' && password == 'admin1234') {
            // Set admin session
            req.session.admin = {
                email: email
            };

            const cprod = await Product.countDocuments({});
            const cUser = await User.countDocuments({});

            let carbons = 0;

            const products = await Product.find({}); // Get all products

            products.forEach(product => {
                carbons += product.carbonFootprint || 0; // Add carbonFootprint, handle undefined/null
            });
            const users = await User.find({ 'purchased.0': { $exists: true } }) // only users with purchases
                .populate('purchased.product', 'name') // populate product name only
                .select('fullname purchased') // fetch only what's needed
                .lean();

            // flattening for easier rendering
            const recentPurchases = [];
            users.forEach(user => {
                user.purchased.forEach(purchase => {
                    if (purchase.product) {
                        recentPurchases.push({
                            username: user.fullname,
                            productName: purchase.product.name,
                            purchasedAt: purchase.purchasedAt
                        });
                    }
                });
            });

            // Sort by recent date (optional)
            recentPurchases.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

            console.log("Total Products:", cprod);
            console.log("Total Users:", cUser);
            console.log("Total Carbon Footprint:", carbons);
            return res.render('admin/dashboard', { cprod, cUser, carbons, recentPurchases})

        }

        res.render('adminLogin', { error: 'Invalid credentials' });
    } catch (error) {
        console.error('Admin login error:', error);
        res.render('adminLogin', { error: 'Something went wrong. Please try again.' });
    }
});
app.get('/adminAnayltics', (req,res)=>{
    res.render('adminAnalytics')
})

// Development-only password reset endpoint
// Allows resetting a user's password by email when not in production
app.post('/dev/reset-password', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden in production' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        return res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password reset error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Add to cart route
app.post('/cart/add', isLoggedIn, async (req, res) => {
    console.log('Add to cart request received');
    const { productId, quantity = 1 } = req.body;

    // Get user ID from either session or token
    const userId = req.user.userId || req.session.user?.userId;
    console.log('User ID:', userId);

    if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ error: "Please login first" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found in database');
            return res.status(404).json({ error: "User not found" });
        }
        console.log('User found:', user.email);

        const existingItem = user.cart.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({
                product: productId,
                quantity,
                addedAt: new Date()
            });
        }

        await user.save();
        console.log('Cart updated successfully');
        return res.status(200).json({ message: "🛒 Product added to cart", cart: user.cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// View cart route
app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.user.id).populate('cart.product');
        res.render('cart', { cart: user.cart });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Error fetching cart');
    }
});

// View purchased items route
app.get('/purchased', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.user.id).populate('purchased.product');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error fetching purchased items:', error);
        res.status(500).send('Error fetching purchased items');
    }
});

function isLoggedIn(req, res, next) {
    // Check session first
    if (req.session.user) {
        console.log('User authenticated via session');
        req.user = req.session.user;
        return next();
    }

    // If no session, check JWT token
    const token = req.cookies.token;
    console.log('Checking token from cookies:', token ? 'Token exists' : 'No token');

    if (!token) {
        console.log('No authentication found');
        return res.status(401).json({ error: "Please login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully for user:', decoded.email);

        // Set user in request
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ error: "Please login first" });
    }
}
// Endpoint to process payment and store product info
app.post('/process-payment', isLoggedIn, async (req, res) => {
    const { orderID, payerID, amount, cartItems } = req.body;

    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        for (const item of cartItems) {
            const product = await Product.findById(item.product._id);
            if (!product) continue;

            user.purchased.push({
                product: product._id,
                quantity: item.quantity,
                purchasedAt: new Date()
            });

            user.totalCarbonFootprint += (product.carbonFootprint * item.quantity);
        }

        user.cart = [];
        await user.save();

        res.json({
            message: 'Dummy Payment successful! Products added to your purchases.',
            totalCarbonFootprint: user.totalCarbonFootprint
        });

    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server (only in non-serverless environments)
const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, async () => {
        await connectDB(); // Ensure connection on server start
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
}

// Export for Vercel serverless
module.exports = app;