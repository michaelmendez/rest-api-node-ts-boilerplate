// const bcrypt = require("bcrypt");
// tslint:disable-next-line: no-var-requires
const bcrypt = require("bcrypt");
import { Request, Response } from "express";
import { verify } from "jsonwebtoken";

import { pool, sql } from "../../..";
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from "../../../config/auth";
import { ISQLUser } from "../../models/User";
const saltRounds = 10;

export async function getAll(req: Request, res: Response): Promise<any> {
  try {
    const sqlResp = await pool.request().execute("GetAllUsers");
    return res.json(sqlResp.recordset);
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function getOne(req: Request, res: Response) {
  // tslint:disable-next-line: no-string-literal
  console.log(req["payload"]);
  try {
    const sqlResp = await pool
      .request()
      // tslint:disable-next-line: no-string-literal
      .input("Email", sql.VarChar(50), req["payload"].Email)
      .execute("GetUser");
    return res.json(sqlResp.recordset);
  } catch (error) {
    res.status(400).send(error);
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
    res.status(400).send(error);
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const sqlResp = await pool
      .request()
      .input("FirstName", sql.VarChar(50), req.body.FirstName)
      .input("LastName", sql.VarChar(50), req.body.LastName)
      .input("Email", sql.VarChar(50), req.body.Email)
      .input("EnneagramId", sql.Int, req.body.EnneagramId)
      .input("MBTIId", sql.Int, req.body.MBTIId)
      .execute("UpdateUser");
    return res.json(sqlResp.recordset);
  } catch (error) {
    res.status(400).send("Failed to Update User");
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
    res.status(400).send(error);
  }
}

// https://www.youtube.com/watch?v=W021RQAL3NU

export async function login(req: Request, res: Response) {
  const { Email, Password } = req.body;
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), Email)
      .query("select * from [dbo].[User] u where u.Email = @Email");

    if (sqlResp.recordset.length) {
      const match = await bcrypt.compare(
        Password,
        sqlResp.recordset[0].Password
      );
      if (match) {
        const user: ISQLUser = sqlResp.recordset[0];
        const refreshToken = createRefreshToken(user);
        sendRefreshToken(res, refreshToken);
        // if (user.tokenVersion !== user.tokenVersion) {
        //   return res.send({ ok: false, accessToken: "" });
        // }
        const accessToken = createAccessToken(user);
        // console.log(accessToken);
        return res.json({
          accessToken,
          user,
          refreshToken: createRefreshToken(user),
        });
      } else {
        res.status(401).send("invalid user");
      }
    } else {
      res.status(401).send("invalid user");
    }
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const sqlResp = await pool
      .request()
      // tslint:disable-next-line: no-string-literal
      .input("Email", sql.VarChar(50), req["payload"].Email)
      .query("select * from [dbo].[User] u where u.Email = @Email");
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function register(req: Request, res: Response) {
  const { Email, Password } = req.body;

  try {
    const hash = await bcrypt.hash(Password, saltRounds);
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), Email)
      .input("Password", sql.VarChar(50), hash)
      .output("Id", sql.Int)
      .output("DateCreated", sql.DateTime)
      .output("DateModified", sql.DateTime)
      .execute("RegisterUser");
    return res.json({
      user: sqlResp.recordset,
    });
  } catch (error) {
    res.status(400).send("Failed to Register User");
  }
}

export async function getUser(req: Request, res: Response) {
  const { Email, Password } = req.body;

  try {
    const hash = await bcrypt.hash(Password, saltRounds);
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), Email)
      .input("Password", sql.VarChar(50), hash)
      .output("Id", sql.Int)
      .output("DateCreated", sql.DateTime)
      .output("DateModified", sql.DateTime)
      .execute("RegisterUser");
    return res.json({
      user: sqlResp.recordset,
    });
  } catch (error) {
    res.status(400).send("Failed to Register User");
  }
}

export const forgotPassword = async (req: Request, res: Response, next) => {
  // revokeRefreshTokens
  const { Email } = req.body;
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), Email)
      .execute("revokeRefreshTokensForUser");
    return res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
  // }

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
    to: req.body.Email,
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
    res.status(400).send("Failed to send Forgot Password Link");
  }
};

export const doRefreshToken = async (req: Request, res: Response, next) => {
  const token = req.params.token; // req.cookies['auth._token.local'];
  if (!token) {
    return res.send({ ok: false, accessToken: "" });
  }

  let payload: any = null;
  try {
    const strippedToken = token; // .split(' ')[1]
    payload = verify(strippedToken, process.env.REFRESH_TOKEN!);

    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), payload.userId)
      .execute("GetUser");
    // .query("select * from [dbo].[User] u where u.Email = @Email");

    const user: ISQLUser = sqlResp.recordset[0];

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({
      ok: true,
      accessToken: createAccessToken(user),
      refreshToken: createRefreshToken(user),
      user,
    });
  } catch (err) {
    console.log(err);
    // return res.send({ ok: false, accessToken: "" });

    res.status(400).send({ ok: false, accessToken: "" });
  }
};

export const revokeRefreshTokens = async (
  req: Request,
  res: Response,
  next
) => {
  try {
    const sqlResp = await pool
      .request()
      .input("Email", sql.VarChar(50), req.body.Email)
      .execute("revokeRefreshTokensForUser");
    return res.sendStatus(200);
  } catch (error) {
    res.status(403);
  }
};

export const isAuth = (req: Request, res: Response, next) => {
  const authorization = req.headers.authorization;
  console.log("auth: " + authorization);
  if (!authorization) {
    res.sendStatus(403);
  } else {
    try {
      // const token = authorization.split(" ")[1];
      const token = authorization;
      const payload = verify(token, process.env.ACCESS_TOKEN);
      // tslint:disable-next-line: no-string-literal
      req["payload"] = payload;
      return next();
    } catch (error) {
      res.status(403).send(error);
    }
  }
};
