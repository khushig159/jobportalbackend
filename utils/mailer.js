const nodemailer=require('nodemailer')
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can also use SMTP or other providers
    auth: {
      user: process.env.APP_USER,
      pass: process.env.APP_PASSWORD
    }
  });

  exports.sendLoginEmail=async(to,name)=>{
    const mailoptions={
        from:process.env.APP_USER,
        to,
        subject:"Login Alert: You've Logged in Successfully!",
        html:`
        <h3>Hello ${name}, </h3>
        <p>We're letting you know that you've successfully logged in to your account.</p>
        <p>Begin your job search with Workora just a click away.</p>
        `
    }
    try{
        await transporter.sendMail(mailoptions);
    }
    catch(err){
        console.error("Email sending failed:", err.message);
    }
  }

  exports.sendLoginEmailRec=async(to,name)=>{
    const mailoptions={
        from:process.env.APP_USER,
        to,
        subject:"Login Alert: You've Logged in Successfully!",
        html:`
        <h3>Hello ${name}, </h3>
        <p>We're letting you know that you've successfully logged in to your account.</p>
        <p>Begin your Hiring journey with Workora just a click away.</p>
        `
    }
    try{
        await transporter.sendMail(mailoptions);
    }
    catch(err){
        console.error("Email sending failed:", err.message);
    }
  }

  exports.sendVerificationEmail = async (to, name, link) => {
    await transporter.sendMail({
      from: process.env.APP_USER,
      to,
      subject: 'Verify Your Email',
      html: `<p>Hi ${name},</p>
             <p>Please <a href="${link}">click here</a> to verify your email.</p>
             <p>This link expires in 1 hour.</p>`
    });
  };
  
  
  exports.sendResetEmail = async (to, name, link) => {
    await transporter.sendMail({
      from: process.env.APP_USER,
      to,
      subject: 'Reset Your Password',
      html: `<p>Hi ${name},</p>
             <p>Please <a href="${link}">click here</a> to reset your password.</p>
             <p>This link expires in 1 hour.</p>`
    });
  };
