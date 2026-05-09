require('dotenv').config();

const mongoose = require('mongoose');

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {

    const exists = await User.findOne({
      email: 'admin@example.com',
    });

    if (exists) {
      console.log('Super admin already exists');
      process.exit();
    }

    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'superuser',
    });

    console.log('Super admin created');

    process.exit();

  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });