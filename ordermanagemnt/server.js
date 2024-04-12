const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const Redis = require("ioredis");

const redis = new Redis();
app.post("/api/client/", (req, res) => {
  const { MsgType, OperationType, ClientId, TenantId, OMSId,OrderType, OrderId, Token } =
    req.body;
  const body = req.body;
  if (!OperationType || !MsgType) {
    return res
      .status(400)
      .json({ error: "Both ClientId and MsgType are required" });
  }
  const fieldValues = Object.entries(body).flat();
  if (MsgType === 1121) {
    var key = `${TenantId}_${OMSId}:${ClientId}`;

    if (OperationType === 100) {
      if (!ClientId || !TenantId || !OMSId) {
        return res
          .status(400)
          .json({ error: "ClientId,TenantId,OMSId is required" });
      }

      redis.exists(key, (err, exists) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (exists) {
          return res.status(400).json({ error: "Client id already exists" });
        } else {
          redis.hmset(key, fieldValues, (err, result) => {
            if (err) {
              console.error("Redis error:", err);
              return res.status(500).json({ error: "Internal server error" });
            }
            res
              .status(201)
              .json({ message: "Client added successfully", result });
          });
        }
      });
    } else if (OperationType === 101) {
      if (!ClientId) {
        return res.status(400).json({ error: "ClientId is required" });
      }

      redis.exists(key, (err, exists) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!exists) {
          return res.status(400).json({ error: "Client id Not exist" });
        } else {
          redis.hmset(key, fieldValues, (err, result) => {
            if (err) {
              console.error("Redis error:", err);
              return res.status(500).json({ error: "Internal server error" });
            }
            res
              .status(201)
              .json({ message: "Client Updated successfully", result });
          });
        }
      });
    } else if (OperationType === 102) {
      if (!ClientId) {
        return res.status(400).json({ error: "ClientId is required" });
      }

      redis.del(key, (err, result) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (result === 0) {
          return res.status(404).json({ error: "Client data not found" });
        }
        res
          .status(200)
          .json({ message: "Client deleted successfully", result });
      });
    } else if (OperationType === 103) {
      if (!ClientId) {
        return res.status(400).json({ error: "ClientId is required" });
      }

      redis.hgetall(key, (err, clientData) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!clientData) {
          return res.status(404).json({ error: "Client data not found" });
        }
        res.json(clientData);
      });
    } else if (OperationType === 104) {
      redis.keys("[0-10000]_[0-10000]:*", (err, keys) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!keys || keys.length === 0) {
          return res.status(404).json({ error: "No records found" });
        }
        const getAllDataPromises = keys.map((key) => {
          return new Promise((resolve, reject) => {
            redis.hgetall(key, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
        });
        Promise.all(getAllDataPromises)
          .then((results) => {
            res.json(results);
          })
          .catch((err) => {
            console.error("Redis error:", err);
            res.status(500).json({ error: "Internal server error" });
          });
      });
    }
  } else if (MsgType === 1120) {
    var key = `${TenantId}_${OMSId}_${ClientId}_${Token}:${OrderId}`;

    if (!OperationType || !MsgType || !ClientId) {
      return res
        .status(400)
        .json({ error: "OperationType, ClientId and MsgType are required" });
    }
    
    if (OperationType === 100) {
      if (!OrderId || !TenantId || !OMSId || !ClientId) {
        return res
          .status(400)
          .json({ error: "OrderId,TenantId,OMSId,ClientId is required" });
      }
      if (OrderType != 1 || OrderType != 2) {
        return res
          .status(400)
          .json({ error: "Order Type can be either 1 or 2" });
      }
      redis.exists(`${TenantId}_${OMSId}:${ClientId}`, (err, exists) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!exists) {
          return res
            .status(400)
            .json({ error: "User not found to place order" });
        } else {
          redis.hmset(key, fieldValues, (err, result) => {
            if (err) {
              console.error("Redis error:", err);
              return res.status(500).json({ error: "Internal server error" });
            }

            res
              .status(201)
              .json({ message: `client order placed successfully`, result });
          });
        }
      });
    } else if (OperationType === 101) {
      if (!OrderId) {
        return res.status(400).json({ error: "OrderId is required" });
      }
      if (OrderType != 1 || OrderType != 2) {
        return res
          .status(400)
          .json({ error: "Order Type can be either 1 or 2" });
      }
      redis.hmset(key, fieldValues, (err, result) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        res.status(201).json({ message: "order edited successfully", result });
      });
    } else if (OperationType === 102) {
      if (!OrderId) {
        return res.status(400).json({ error: "OrderId is required" });
      }
      redis.del(key, (err, result) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (result === 0) {
          return res.status(404).json({ error: "order data not found" });
        }
        res.status(200).json({ message: "order deleted successfully", result });
      });
    } else if (OperationType === 103) {
      if (!OrderId) {
        return res.status(400).json({ error: "OrderId is required" });
      }
      redis.hgetall(key, (err, clientData) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!clientData) {
          return res.status(404).json({ error: "order data not found" });
        }
        res.json(clientData);
      });
    } else if (OperationType === 104) {
      redis.keys("[0-10000]_[0-10000]_[0-10000]_*:*", (err, keys) => {
        if (err) {
          console.error("Redis error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!keys || keys.length === 0) {
          return res.status(404).json({ error: "No records found" });
        }
        const getAllDataPromises = keys.map((key) => {
          return new Promise((resolve, reject) => {
            redis.hgetall(key, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
        });
        Promise.all(getAllDataPromises)
          .then((results) => {
            res.json(results);
          })
          .catch((err) => {
            console.error("Redis error:", err);
            res.status(500).json({ error: "Internal server error" });
          });
      });
    }
  }
});
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
