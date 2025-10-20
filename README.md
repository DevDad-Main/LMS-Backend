# LearnHub - Student Learning Management System

A modern, scalable backend for a student learning management system built with modern backend technologies.

## 🚀 Features

### Core Features

- **User Authentication & Authorization** - Secure JWT-based authentication and Google Oauth 2.0 Authentication
- **Instructor Profiles** - Customizable instructor profiles with bio, avatar, expertise, profression and personal information
- **Courses - Instructor** - Create, edit and delete courses
- **Courses - Student** - Purchase, enroll, and progress courses
- **Course Interactions** - Toggle lectures complete, leave reviews, and notes at specific times during the course

### Advanced Features

- **Media Upload** - Image and video upload with cloud storage integration
- **Search & Discovery** - Find courses with advanced search via filters and search criteria
- **Privacy Controls** - Granular privacy settings for posts and profile visibility
- **API Rate Limiting** - Protection against abuse and spam

## 🛠️ Tech Stack

### Backend Framework

- **Node.js** - Runtime environment
- **Express.js** - Web application framework

### Database

- **MongoDB** - Primary database for user data and posts
- **Mongoose** - MongoDB object modeling

### Authentication & Security

- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Cloud Services

- **Cloudinary** - Image processing and optimization

### Payment Gateway

- **Stripe** - Payment gateway for online payments

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js**
- **MongoDB**
- **npm** or **yarn** package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DevDad-Main/LMS-Backend.git
cd LMS-Backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
PORT="8000"

NODE_ENV="development"

MONGO_URI=""

CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_CLOUD_NAME=""

GOOGLE_CLIENT_ID=""

JWT_SECRET="asakdjkajdajdjakxjxkaextremelysuperasdasdsecretsdasdatoken"
JWT_EXPIRES_IN="7d"
JWT_COOKIE_EXPIRES_IN="7"

CLIENT_URL="http://localhost:5173,https://yourdeployurl.com"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_specific_password"

STRIPE_SK=""
STRIPE_WEBHOOK_SECRET=""

MAX_FILE_SIZE="5242880"

UPLOAD_PATH="./uploads"

BCRYPT_SALT_ROUNDS="10"

RATE_LIMIT_WINDOW="15"
RATE_LIMIT_MAX="100"

RAZORPAY_KEY_ID="rzp_test_abc"
RAZORPAY_KEY_SECRET="5m5lCr3abc"
```

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The server will start on `http://localhost:8000`

## 📚 API Documentation

### User Endpoints

```
GET    /api/v1/users/signout             - User logout
GET    /api/v1/users/user-authenticated  - User Authenticated
GET    /api/v1/users/enrolled-courses    - User Authenticated
GET    /api/v1/users/cart/get            - Users Cart
GET    /api/v1/users/dashboard           - Users Dashboard
POST   /api/vi/users/signup              - Register new user
POST   /api/v1/users/google-login        - User login with google
POST   /api/v1/users/signin              - User login
POST   /api/v1/users/cart/add            - Add course to cart
DELETE  /api/v1/users/cart/delete/:id    - Add course to cart
```

### Course Endpoints

```
GET    /api/v1/course/all                                   - Get courses by filter/criteria (public)
GET    /api/v1/course/courses                               - Get all courses (public)
GET    /api/v1/course/learn/c/:id                           - Get course details (authenticated user — enrolled view)
GET    /api/v1/course/c/:id                                 - Get course details (public/general view)
PUT    /api/v1/course/c/:id                                 - Update course details (instructor only)
DELETE /api/v1/course/c/:courseId                           - Delete a course (should be instructor only)
POST   /api/v1/course/add-course                            - Create a new course (instructor only)
POST   /api/v1/course/c/:id/last-accessed                   - Update "last accessed" timestamp (authenticated user)
POST   /api/v1/course/add-lecture                           - Add lecture (general handler — likely instructor)
POST   /api/v1/course/:courseId/add-section                 - Add section to a course (instructor only)
POST   /api/v1/course/:courseId/section/:sectionId/add-lecture   - Add lecture to specific section (instructor only)
POST   /api/v1/course/:id/lecture/:lectureId/toggle-complete     - Toggle lecture completion (authenticated user)
PUT    /api/v1/course/:savedCourseId/update-lecture/:editingLectureId  - Update existing lecture (instructor only)
POST   /api/v1/course/:savedCourseId/update-section/:editingSectionId  - Update existing section (instructor only)
DELETE /api/v1/course/:savedCourseId/delete-section/:sectionId         - Delete a section (instructor only)
DELETE /api/v1/course/:savedCourseId/section/:sectionId/delete-lecture/:lectureId  - Delete a lecture (instructor only)
```

## 🏗️ Project Structure

```
LMS-Backend/
├── src/
│   ├── controllers/       # Route controllers
│   ├── database/          # Database setup
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   ├── tests/             # Test files
├── .env.example           # Environment variables template
├── package.json
└── README.md
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Categories

- [ x ] **Unit Tests** - Individual function testing
- [ x ] **Integration Tests** - API endpoint testing
- [ ] **E2E Tests** - End-to-end workflow testing

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment-Specific Configurations

- **Development** - Local development with hot reload
- **Staging** - Pre-production testing environment
- **Production** - Optimized production deployment

## 📊 Performance & Monitoring

### Performance Features

- **Database Indexing** - Optimized queries with proper indexing
- **API Rate Limiting** - Prevent abuse and ensure fair usage

### Monitoring

- **Logging** - Structured logging with Winston
- **Error Tracking** - Comprehensive error handling and reporting

## 🔒 Security

### Security Measures

- **Input Validation** - Joi/Yup validation for all inputs
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content sanitization
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - API abuse prevention
- **Helmet.js** - Security headers
- **Data Encryption** - Sensitive data encryption at rest

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and conventions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **DevDad-Main** - Lead Developer & Project Maintainer - [softwaredevdad@gmail.com](mailto:softwaredevdad@gmail.com)

## 🗺️ Roadmap

### Upcoming Features

- [ ] **User Controllers** - Complete last controllers
- [ ] **E2E Tests** - End-to-end workflow testing
