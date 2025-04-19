# Revibe - Sustainable E-commerce Platform

## About The Project

Revibe is an environmentally-conscious e-commerce platform developed for the WebDash hackathon. The platform exclusively lists recycled and upcycled products along with their carbon footprints, allowing environmentally conscious consumers to make informed purchasing decisions.

## Live Demo

[View Live Demo](https://revibe-neon.vercel.app/)

## Features

### Product Listing
Revibe exclusively displays recycled or upcycled products on the platform. Each product listing includes detailed information about the product's carbon footprint, materials used, and environmental impact. This transparency allows consumers to make environmentally responsible choices while shopping. Products are categorized based on their sustainability metrics, making it easier for users to find items aligned with their environmental values.

### Cart System
The platform features a comprehensive cart system that allows users to easily add, remove, and manage products. Users can adjust quantities, view real-time subtotals, and save items for later. The cart system also shows the accumulated carbon footprint of selected items, reinforcing the platform's commitment to environmental awareness throughout the shopping experience.

### Payment Gateway
Revibe integrates with PayPal for secure and reliable payment processing. This integration ensures that user transactions are protected while providing a familiar and trusted checkout experience. Multiple payment options are supported to accommodate various user preferences.

### Order Carbon Summary
A unique feature of Revibe is the Order Carbon Summary, which calculates the total environmental impact of a user's order. This feature aggregates the carbon footprints of individual products and presents users with a comprehensive view of their purchase's environmental impact. Users can see how their shopping choices affect the planet and make adjustments if desired.

### Global Footprint Tracker
The Global Footprint Tracker is a dedicated section on the user's profile that displays their total carbon footprint based on their purchase history and platform activities. This feature visualizes the user's environmental impact over time, showing progress and encouraging more sustainable shopping habits. Users can set personal goals for reducing their carbon footprint.

### User Login System
Revibe implements a secure authentication and session management system. Users can register and login using a secure OTP (One-Time Password) system delivered via email, eliminating password-related security risks. For administrative purposes, there is a single admin account with enhanced security measures to safeguard sensitive platform functions. This approach balances convenience for regular users with stringent security for administrative access.

### Mobile Responsive Design
The platform is fully optimized for all screen sizes, ensuring a seamless experience across desktop and mobile devices. The responsive design adapts to different viewport sizes, maintaining functionality and aesthetics regardless of the device used to access the platform.

### Green Leaderboard
Revibe features a Green Leaderboard that ranks users based on their eco-friendly purchases and carbon footprint reduction. This gamification element encourages sustainable shopping habits by fostering friendly competition among users. Top-ranked users may receive special badges or rewards, incentivizing environmentally conscious behavior.

### Admin Dashboard
The platform includes a comprehensive admin panel for managing products, categories, and sustainability data. Administrators can add new products, update carbon footprint metrics, manage user accounts, and monitor platform performance. The dashboard provides valuable insights into sustainability trends and user behavior, helping to continuously improve the platform's environmental impact.

### Live Carbon Data API
Revibe integrates with external APIs to provide real-time carbon emission data. This integration ensures that the environmental impact calculations are accurate and up-to-date. The API data enriches product listings and user insights with scientifically sound environmental metrics.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: EJS, CSS, JavaScript
- **Authentication**: JWT, bcrypt
- **File Handling**: Multer, Cloudinary
- **Email Service**: Nodemailer
- **Payment Processing**: PayPal

## Libraries Used

- express
- mongoose
- ejs
- path
- cookie-parser
- bcrypt
- jsonwebtoken
- express-session
- nodemailer
- multer
- cloudinary
- dotenv

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/JUGADU-GEEKS/ReVibe.git
   cd Revibe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file in the root directory with the following variables**
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email_username
   EMAIL_PASS=your_email_password
   ```

4. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
revibe/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middlewares/        # Custom middleware functions
├── models/             # MongoDB models
│   ├── userModel.js
│   └── productModel.js
├── public/             # Static files (CSS, JS, images)
├── routes/             # Route definitions
├── utils/              # Utility functions
├── views/              # EJS templates
├── .env                # Environment variables
├── app.js              # Main application file
└── package.json        # Project dependencies
```

## Environmental Impact Features

### Carbon Footprint Calculation

The platform calculates carbon footprints for:
- Individual products based on materials, manufacturing process, and transportation
- Complete orders by aggregating product footprints
- User's overall shopping history and environmental impact over time

### Sustainability Metrics

Products are evaluated based on:
- Materials used (percentage of recycled content)
- Manufacturing process energy consumption
- Transportation distance and method
- End-of-life recyclability and biodegradability

### User Engagement

- Green Leaderboard to encourage eco-friendly shopping through healthy competition
- Personalized recommendations for reducing environmental impact 
- Visual representations of carbon savings compared to conventional products
- Educational content about sustainable consumption practices

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [kunalsharma7003@gmail.com](mailto:kunalsharma7003@gmail.com)

Project Link: [https://github.com/JUGADU-GEEKS/ReVibe.git](https://github.com/JUGADU-GEEKS/ReVibe.git)

## Acknowledgements

- WebDash Hackathon
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)
- [PayPal](https://www.paypal.com/)