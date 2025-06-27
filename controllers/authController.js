const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const link = `http://localhost:3000/api/auth/verify/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `ResolveNow Support <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email',
      html: `
        <h2>Welcome to ResolveNow, ${name}!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${link}">Verify Your Account</a>
      `
    });

    res.status(200).json({ message: 'Registered successfully. Check your email to verify your account.' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).send('Invalid token');

    user.isVerified = true;
    await user.save();

    res.send(`
      <div style="text-align:center;padding:30px;font-family:Arial">
        <h2>✅ Email Verified Successfully!</h2>
        <p>You can now <a href="/login.html">Login</a> to your account.</p>
      </div>
    `);
  } catch (error) {
  console.error("❌ Registration failed:", error);  // This line is important
  res.status(500).json({ message: "Registration failed" });
}
};