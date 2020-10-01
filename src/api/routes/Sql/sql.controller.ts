// const bcrypt = require("bcrypt");
// tslint:disable-next-line: no-var-requires
const bcrypt = require("bcrypt");
import { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";

import { pool, sql } from "../../..";
import { createAccessToken, createRefreshToken } from "../../../config/auth";
const saltRounds = 10;

export async function getAll(req: Request, res: Response): Promise<any> {
  try {
    const sqlResp = await pool.request().execute("GetAllUsers");
    return res.json(sqlResp.recordset);
  } catch (error) {
    console.log(error);
  }
}

export async function getOneByEmail(req: Request, res: Response) {
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), req.body.Email)
      .query("select * from [dbo].[User] u where u.Email = @Email");
    return res.json(sqlResp.recordset);
  } catch (error) {
    console.log(error);
  }
}

export async function addOne(req: Request, res: Response) {
  try {
    const sqlResp = await pool
      .request()
      .input("FirstName", sql.VarChar(50), req.body.FirstName)
      .input("LastName", sql.VarChar(50), req.body.LastName)
      .input("Email", sql.VarChar(50), req.body.Email)
      .input("EnneagramId", sql.Int, req.body.EnneagramId)
      .input("MBTIId", sql.Int, req.body.MBTIId)
      .output("Id", sql.Int)
      .output("DateCreated", sql.DateTime)
      .output("DateModified", sql.DateTime)
      .execute("InsertUser");
    return res.json(sqlResp.recordset);
  } catch (error) {
    console.log(error);
  }
}

export async function deleteOneByEmail(req: Request, res: Response) {
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), req.body.Email)
      .execute("DeleteUser");
    return res.json(sqlResp.recordset);
  } catch (error) {
    console.log(error);
  }
}

// https://www.youtube.com/watch?v=W021RQAL3NU

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), email)
      .query("select * from [dbo].[User] u where u.Email = @Email");

    if (sqlResp.recordset.length) {
      //   const passHash = await bcrypt.hash(password, saltRounds);
      const match = await bcrypt.compare(
        password,
        sqlResp.recordset[0].Password
      );
      if (match) {
        const user = sqlResp.recordset[0];
        res.cookie("djTest", createRefreshToken(req.body), {
          httpOnly: true,
        });
        return res.json({
          accessToken: createAccessToken(req.body),
          user,
        });
      } else {
        res.status(401).send("invalid user");
      }
    } else {
      res.status(401).send("invalid user");
    }
  } catch (error) {
    console.log(error);
  }
}

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    // const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, saltRounds);
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), email)
      .input("Password", sql.VarChar(50), hash)
      .output("Id", sql.Int)
      .output("DateCreated", sql.DateTime)
      .output("DateModified", sql.DateTime)
      .execute("RegisterUser");
    res.cookie("djTest", createRefreshToken(req.body), {
      httpOnly: true,
    });
    return res.json({
      user: sqlResp.recordset,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("Failed to Register User");
  }
}

export const forgotPassword = async (req: Request, res: Response, next) => {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.FORGOT_PASSWORD_EMAIL,
      pass: process.env.FORGOT_PASSWORD_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "youremail@gmail.com",
    to: req.body.email,
    subject: "Forgot Password",
    html: "<h1>Forgot Password Link</h1><p>That was easy!</p>",
  };
  try {
    const resp = await transporter.sendMail(mailOptions);
    if (resp) {
      console.log("Email sent: " + resp.response);
      res.send("Email sent: " + resp.response);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send("Failed to send Forgot Password Link");
  }
};

// export function getToken(req: Request, res: Response, next) {
//   const bearerHeader = req.headers.authorization;
//   if (bearerHeader !== undefined) {
//     console.log("got bearer");
//     const bearer = bearerHeader.split(" ");
//     const bearerToken = bearer[1];
//     req["token"] = bearerToken;
//     next();
//   } else {
//     res.sendStatus(403);
//   }
// }

// export function verifyToken(req: Request, res: Response, next) {
//   jsonwebtoken.verify(req["token"], "secretkey", (err, authData) => {
//     if (err) {
//       res.sendStatus(403);
//     } else {
//       res.json(authData);
//     }
//   });
// }

export const isAuth = (req: Request, res: Response, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.sendStatus(403);
  } else {
    console.log("got token");
    try {
      const token = authorization.split(" ")[1];
      const payload = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN);
    } catch (error) {
      res.sendStatus(403);
    }
    return next();
  }
};
