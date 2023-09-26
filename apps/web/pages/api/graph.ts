import type { NextApiRequest, NextApiResponse } from "next";
import schema from "../../graphql";
import verifyDomain from "../../middlewares/verify-domain";
import nc from "next-connect";
import passport from "passport";
import { graphql } from "graphql";
import jwtStrategy from "../../lib/jwt";
import ApiRequest from "../../models/ApiRequest";
import connectDb from "../../middlewares/connect-db";
import constants from "../../config/constants";
import { error } from "../../services/logger";
import { responses } from "../../config/strings";
import { getAddress } from "../../lib/utils";

passport.use(jwtStrategy);

export default nc<NextApiRequest, NextApiResponse>({
    onError: (err, req, res, next) => {
        if (err.message.indexOf(responses.domain_doesnt_exist) === -1) {
            error(err.message, {
                fileName: `/api/graph.ts`,
                stack: err.stack,
            });
        }
        res.status(500).json({ error: err.message });
    },
    onNoMatch: (req, res) => {
        res.status(404).end("Not found");
    },
})
    .use(passport.initialize())
    .use(connectDb)
    .use(verifyDomain)
    .use((req: NextApiRequest, res: NextApiResponse, next: any) => {
        if (req.cookies[constants.jwtTokenCookieName]) {
            passport.authenticate("jwt", { session: false })(req, res, next);
        } else {
            next();
        }
    })
    .post(async (req: ApiRequest, res: NextApiResponse) => {
        if (!req.body.hasOwnProperty("query")) {
            res.status(400).json({ error: "Query is missing" });
        }

        const source = req.body.query;
        const hostname = req.headers["host"] || "";
        const protocol = req.headers["x-forwarded-proto"];
        const contextValue = {
            user: req.user,
            subdomain: req.subdomain,
            address: getAddress(hostname, protocol),
        };
        const response = await graphql({
            schema,
            source,
            rootValue: null,
            contextValue,
        });
        return res.status(200).json(response);
    });
