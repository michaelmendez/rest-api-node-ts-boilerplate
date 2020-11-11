import * as bodyParser from "body-parser";

// tslint:disable-next-line: no-var-requires
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";

import api from "./api/index";
// import * as errorHandler from "./helpers/errorHandler";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setMiddlewares();
    this.setRoutes();
    this.catchErrors();
  }

  private setMiddlewares(): void {
    this.express.use(cors(corsOptions));
    this.express.use(morgan("dev"));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(helmet());
  }

  private setRoutes(): void {
    this.express.use("/api", api);
    this.express.get("/", (req, res) => {
      res.send("<h1>Scraper Backend Up</h1>");
    });
  }

  private catchErrors(): void {
    // this.express.use(errorHandler.notFound);
    // this.express.use(errorHandler.internalServerError);
  }
}

export default new App().express;
