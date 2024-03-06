const userModel = require("../../../Models/Auth/userModel.js");
const otpModel = require("../../../Models/Auth/otpModel.js");
const loginLogModel = require("../../../Models/Auth/loginLogModel.js");
const forgotpasswordModel = require("../../../Models/Auth/forgotPasswordModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const hbs = require("handlebars");
const path = require("path");
const fs = require("fs");
const getuser = require("../../../validators/authorize.js").getUser;
const Sniffr = require("sniffr");
var { decrypt } = require("@rlvt/crypt");
const shareHoldersModel = require("../../../Models/ShareHolders/shareHoldersModel.js");

const hashPasword = async (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return done(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        resolve(hash);
      });
    });
  });
};

//Password Checker
const isPasswordCorrect = async (pass1, pass2) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(pass1, pass2, (err, result) => {
      resolve(result);
    });
  });
};

const PB_email = process.env.SENDER_GMAIL_ADDRESS;
const pass = process.env.SENDER_GMAIL_PASSWORD;

const email_info = nodemailer.createTransport({
  host: "mail.purposeblack.et",
  port: 465,
  secure: true,
  auth: {
    user: PB_email,
    pass: pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const readHTMLFile = function (path, callback) {
  fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
    if (err) {
      throw err;
      callback(err);
    } else {
      callback(null, html);
    }
  });
};

const filePath = path.join(__dirname, "../../../email/otp.html");

module.exports = {
  /**
   * userController.get_conversion()
   */

  /**
   * userController.login()
   */
  login: async function (req, res) {
    //console.log(req.body.username);
    const body = req.body;
    const email = body.username.toLowerCase();
    let user = await userModel.findOne({ email: email });
    //console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: `Incorrect Credential!`,
      });
    } else {
      ////console.log(await isPasswordCorrect(body.password, user.password));
      if (await isPasswordCorrect(body.password, user.password)) {
        // //console.log(logins)
        let otp = (Math.floor(Math.random() * 10000) + 10000)
          .toString()
          .substring(1);
        let new_otp = new otpModel({
          email: req.body.username,
          otp: otp,
        });

        let newOtp = await new_otp.save();

        if (!newOtp) {
          return res.status(200).json({
            success: false,
            message: `OTP not Sent successfully!`,
          });
        } else {
          try {
            readHTMLFile(filePath, function (err, html) {
              const template = hbs.compile(html);
              const replacements = {
                otp: otp,
              };
              const htmlToSend = template(replacements);
              const email = {
                from: PB_email,
                to: user.email,
                subject: "PurposeBlack ETH ShareHolder OTP",
                html: htmlToSend,
              };
              email_info.sendMail(email, (error, info) => {
                if (error) {
                  console.log(error);
                  console.log("email not sent!");
                  return res.status(200).json({
                    success: false,
                    message: `OTP not Sent successfully!`,
                  });
                } else {
                  console.log(info);
                  return res.status(201).json({
                    success: true,
                    message: "OTP not Sent successfully!",
                  });
                }
              });
            });
          } catch (error) {
            console.log(error);
            return res.status(200).json({
              success: true,
              message: `OTP Sent successfully!`,
            });
          }
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Incorrect Credential!`,
        });
      }
    }
  },

  verifyOtp: async function (req, res) {
    const userOTP = req.body.otp;
    //console.log(user);
    let otp = await otpModel.findOne({ otp: userOTP, status: false });
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: `Wrong OTP, please try again`,
      });
    } else {
      let user = await userModel.findOne({ email: otp.email });
      //console.log(req.connection.remoteAddress)
      const userAgent = req.headers["user-agent"];
      //console.log(userAgent)
      // const s = new Sniffr();
      // console.log(s);

      var logins = new loginLogModel({
        ip: req.connection.remoteAddress,
        // device: s.os.name + " " + s.os.version + " " + s.browser.name,
        user_agent: userAgent,
        user_type: user.role,
        user: user._id,
      });
      otp.status = true;

      await otp.save();
      console.log(process.env.JWT_SECRET);
      let loginLog = await logins.save();
      if (!loginLog) {
        return res.status(500).json({
          message: "Error when creating logins",
          error: err,
        });
      }
      jwt.sign(
        {
          role: user.role,
          userID: user._id,
        },
        process.env.JWT_SECRET,
        (err, token) => {
          return res.status(200).json({
            success: true,
            message: `Sign In Successfull`,
            token: "Bearer " + token,
          });
        }
      );
    }
  },

  forgotpassword: async function (req, res) {
    const email = req.body.email.toLowerCase();
    //console.log(email);

    let user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Email not found!",
      });
    }

    const data = {
      email: email,
      id: user._id,
    };

    let forgotpassword_check = await forgotpasswordModel.findOne({
      $and: [{ user: user.id }, { done: false }],
    });

    //console.log(forgotpassword_check);

    if (!forgotpassword_check) {
      const random_key = crypto.randomBytes(32).toString("hex");
      const key = random_key + user.password;
      const hashed_key = crypto.createHash("sha256").update(key).digest("hex");

      const token = jwt.sign(data, hashed_key, { expiresIn: "30m" });
      const encryptedToken = ted.encrypt(token);

      var forgotpassword = new forgotpasswordModel({
        email: email,
        token: hashed_key,
        done: false,
        user: user._id,
      });

      try {
        readHTMLFile(filePath, function (err, html) {
          ////console.log(err)
          const template = hbs.compile(html);
          const replacements = {
            link: `https://user.purposeblacketh.com//user/reset-password?id=${user._id}&token=${encryptedToken}`,
            name: user.first_name,
          };
          const htmlToSend = template(replacements);
          const emails = {
            from: PB_email,
            cc: "purposeblackethiopia@gmail.com",
            to: email,
            subject: "PurposeBlack ETH user password reset",
            html: htmlToSend,
          };
          email_info.sendMail(emails, (error, info) => {
            if (error) {
              console.log("email not send" + error);
              return res
                .status(200)
                .json({ success: false, message: "Email not send" });
            } else {
              forgotpassword.save(function (err, user) {
                if (err) {
                  return res.status(500).json({
                    message: "Error when updating password.",
                    error: err,
                  });
                }
                //console.log("email sent", info);

                return res.status(200).json({
                  success: true,
                  message: "email sent!",
                });
              });
            }
          });
        });
      } catch (error) {
        return res.json({
          success: false,
          message: "email not sent!",
        });
      }
    } else {
      //console.log("somthing");
      forgotpassword_check.done = true;
      forgotpassword_check.save((err, forgot) => {
        const random_key = crypto.randomBytes(32).toString("hex");
        const key = random_key + user.password;
        const hashed_key = crypto
          .createHash("sha256")
          .update(key)
          .digest("hex");

        const token = jwt.sign(data, hashed_key, { expiresIn: "30m" });
        const encryptedToken = ted.encrypt(token);

        var forgotpassword = new forgotpasswordModel({
          email: email,
          token: hashed_key,
          done: false,
          user: user._id,
        });

        try {
          readHTMLFile(filePath, function (err, html) {
            ////console.log(err)
            const template = hbs.compile(html);
            const replacements = {
              link: `${process.env.PUBLIC_URL}/user/reset-password?id=${user._id}&token=${encryptedToken}`,
              name: user.first_name,
            };
            const htmlToSend = template(replacements);
            const emails = {
              from: PB_email,
              cc: "purposeblackethiopia@gmail.com",
              to: email,
              subject: "PurposeBlack ETH user password reset",
              html: htmlToSend,
            };
            email_info.sendMail(emails, (error, info) => {
              if (error) {
                //console.log("email not send" + error);
              } else {
                forgotpassword.save(function (err, user) {
                  if (err) {
                    return res.status(500).json({
                      message: "Error when updating password.",
                      error: err,
                    });
                  }
                  //console.log("email sent", info);

                  return res.status(200).json({
                    success: true,
                    message: "email sent!",
                  });
                });
              }
            });
          });
        } catch (error) {
          return res.json({
            success: false,
            message: "email not sent!",
          });
        }
      });
    }
  },

  verifypasswordresettoken: async function (req, res) {
    const id = req.body.id;
    const token = req.body.token;
    //console.log(id);
    let user = await userModel.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found!",
      });
    }
    let forgotpassword = await forgotpasswordModel.findOne({
      $and: [{ user: id }, { done: false }],
    });
    if (forgotpassword) {
      try {
        const decryptedToken = ted.decrypt(token);
        const verifyToken = jwt.verify(decryptedToken, forgotpassword.token);
        return res.status(200).json({
          success: true,
          message: "token verifyed!",
        });
      } catch (err) {
        forgotpassword.token = "Invalid token used or link expierd";
        forgotpassword.done = true;
        forgotpassword.save((err, forgotpassword) => {
          if (err) {
            //console.log(err);
            return res.status(500).json({
              success: false,
              message: "Something went wrong!",
            });
          }
          //console.log("token verify faild");
          return res.status(303).json({
            success: false,
            message: "invalid token or link expierd",
          });
        });
      }
    } else {
      return res.status(303).json({
        success: false,
        message: "invalid token or link expierd",
      });
    }
  },

  resetPassword: async function (req, res) {
    const id = req.body.id;
    const token = req.body.token;
    const password = req.body.password;
    let user = await userModel.findOne({ _id: id });
    let forgotpassword = await forgotpasswordModel.findOne({
      $and: [{ user: id }, { done: false }],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found!",
      });
    }
    const decryptedToken = ted.decrypt(token);
    try {
      const verifyToken = jwt.verify(decryptedToken, forgotpassword.token);
      const hashed_password = await hashPasword(password);
      user.password = password ? hashed_password : user.password;
      user.save(function (err, user) {
        if (err) {
          //console.log(err);
          return res.status(500).json({
            success: false,
            message: "Password reset failed! user",
          });
        }
        forgotpassword.token = "Password changed";
        forgotpassword.done = true;
        forgotpassword.save((err, forgotpassword) => {
          if (err) {
            //console.log(err);
            return res.status(500).json({
              success: false,
              message: "Password reset failed! forgot",
            });
          }
          return res.status(200).json({
            success: true,
            message: "Password reseted!",
          });
        });
      });
    } catch (e) {
      //console.log(e);
      return res.status(500).json({
        success: false,
        message: "token invalid or link expierd",
      });
    }
  },

//   updatePassword: async function (req, res) {
//     const userId = req.body.id;
//     const token = req.body.token;
//     const newPassword = req.body.password;
//     try {
//         const user = await userModel.findById(userId);

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found!",
//             });
//         }

//         const decryptedToken = ted.decrypt(token);
//         const verifyToken = jwt.verify(decryptedToken, user.resetToken);

//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         user.password = hashedPassword;

//         // Clear the resetToken and resetTokenExpiry
//         user.resetToken = undefined;
//         user.resetTokenExpiry = undefined;

//         // Save the updated user password and resetToken
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             message: "Password updated successfully!",
//         });
//     } catch (error) {
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(500).json({
//                 success: false,
//                 message: "Token invalid or link expired",
//             });
//         }

//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//         });
//     }
// },
};
