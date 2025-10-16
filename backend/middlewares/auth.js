import jwt from "jsonwebtoken"
import {JWT_SECRET} from "../config.js"

//authentication 
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(403).json({});
  }

  //get thetokenn
  const token = authHeader.split("")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.userid) {
      req.userid = decoded.userid;
      next();
    }
  } catch (err) {
    return res.status(403).json({});
  }
};


