import { Response } from "express";
import { sign } from "jsonwebtoken";

import { ISQLUser } from "../api/models/User";

// tslint:disable-next-line: no-submodule-imports
import "dotenv/config";

export const createAccessToken = (user: ISQLUser) => {
  return sign({ userId: user.Email }, process.env.ACCESS_TOKEN, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (user: ISQLUser) => {
  return sign(
    { userId: user.Email, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    }
  );
};

export const sendRefreshToken = (res: Response, token: string) => {
  res = res.cookie("djtest", token, {
    httpOnly: true,
    path: "/"
  });
  return res
};
