# Employee Management System

A modern Employee Management System built with a React (Vite) frontend and Node.js/Express backend, designed to help organizations manage employee records, leave, and user access.

---

## Features

- **Employee Dashboard**: View, search, and manage employee details in a responsive table and card layout.
- **Employee Registration**: Register new employees (by admin/superuser) and allow self-signup for new users.
- **Employee Profile Editing**: Update employee information, including image uploads with validation (JPEG/PNG, under 2MB).
- **Leave Management**: Track employee leave, view who is currently on leave, and manage leave requests (pending approval for admins).
- **Authentication & Authorization**: API endpoints secured with JWT; user roles supported (superuser/admin vs standard employee).
- **Notifications**: Real-time toast notifications for actions, errors, and status updates.
- **Responsive UI**: Built with Bootstrap and custom styling for a professional dashboard experience.
- **API Integration**: Uses Axios for client-server communication.
- **Validation & Error Handling**: Both client and server-side validation with user-friendly error messages.

---

## Technologies Used

### Frontend

- [React](https://reactjs.org/) (with Vite)
- [React Router](https://reactrouter.com/) for routing
- [Bootstrap](https://getbootstrap.com/) for UI components
- [React Toastify](https://fkhadra.github.io/react-toastify/) for notifications
- [Axios](https://axios-http.com/) for HTTP requests

### Backend

- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/) for authentication
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing
- [Multer](https://www.npmjs.com/package/multer) for file uploads
- [dotenv](https://www.npmjs.com/package/dotenv) for environment variables
- [helmet](https://www.npmjs.com/package/helmet) for security
- [express-validator](https://express-validator.github.io/) for input validation

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB

### Setup

1. **Clone the repository**
    ```bash
    git clone https://github.com/Muniafu/Employee-Management.git
    cd Employee-Management
    ```

2. **Install dependencies**

    **Backend**
    ```bash
    cd server
    npm install
    ```

    **Frontend**
    ```bash
    cd ../client
    npm install
    ```

3. **Environment Variables**

    - Create a `.env` file in the `server` directory for backend configuration (e.g., MongoDB URI, JWT secret).

4. **Run the Application**

    **Backend**
    ```bash
    npm run dev
    ```

    **Frontend**
    ```bash
    npm run dev
    ```

    - Visit `http://localhost:5000` (or as configured) in your browser.

---

## Usage Highlights

- **Dashboard**: Provides quick access to employee data, leave status, and onboarding actions.
- **Add/Edit Employee**: Admins can add new employees and update their details, including uploading profile images.
- **Leave Tracking**: Employees and admins can see who is on leave, with clear visual indicators and pending approval lists for admins.
- **Notifications**: Users receive contextual feedback for their actions via toast notifications.

---

## Project Structure

- `client/` - React frontend
  - `src/UI/` - Reusable UI components (e.g., WelcomeUI, LeaveUI)
  - `src/User/` - User-related pages and components (register, edit)
  - `src/Dashboard/` - Dashboard and employee table/list
  - `src/utils/` - Utility functions (leave calculations, validation)
- `server/` - Node.js backend
  - `server.js` - Main server file
  - `package.json` - Backend dependencies

---

## Notes

- This README is based on available code and may not reflect every feature or file in the repository. For more details, browse the source code:  
  [View the full code on GitHub](https://github.com/Muniafu/Employee-Management/search?q=readme+OR+setup+OR+install+OR+feature+OR+usage+OR+requirement+OR+technology+OR+author+OR+license+OR+description+OR+instruction+OR+employee)

---

## License

This project is provided as-is without a license specified. Please add a license if you intend to share or reuse the code.

---

## Author

- [Muniafu](https://github.com/Muniafu)

---

Feel free to further expand or update any section based on evolving project features or requirements!
