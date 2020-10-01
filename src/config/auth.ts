// tslint:disable-next-line: no-submodule-imports
import "dotenv/config"
import { sign } from "jsonwebtoken"
import { IUser } from "../api/models/User"

export const createAccessToken = (user: IUser) => {
    return sign({userId:user.Id}, process.env.ACCESS_TOKEN, {
        expiresIn: '15m'
    })
}

export const createRefreshToken = (user: IUser) => {
    return sign({userId:user.Id}, process.env.REFRESH_TOKEN, {
        expiresIn: '7d'
    })
}