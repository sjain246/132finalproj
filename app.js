"use strict";

const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const app = express();

// for application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); // built-in middleware
// for application/json
app.use(express.json()); // built-in middleware
// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module

const SERVER_ERR_CODE = 500;
const SERVER_ERROR = "An error occured on the server. Try again later!";
const CLIENT_ERR_CODE = 400;

app.use(express.static("public"));

app.get("/products", async (req, res, next) => {
    try {
        let prods = await fs.readFile("product_info/all_prods.json");
        let prodsJson = JSON.parse(prods);
        res.json(prodsJson);
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.get("/filter/:category", async (req, res, next) => {
    let cat = req.params.category.toLowerCase();
    try {
        let prods = await fs.readFile("product_info/all_prods.json");
        let prodsJson = JSON.parse(prods);
        let filteredProds = [];
        prodsJson.products.forEach(product => {
            if (product.category.toLowerCase() == cat){
                filteredProds.push(product);
            }
        });
        if (filteredProds.length == 0) {
            throw new TypeError();
        }
        else {
            res.json({"products": filteredProds});
        }
        
    } catch (err) {
        if (err instanceof TypeError) {
            res.status(CLIENT_ERR_CODE);
            err.message = `Category ${req.params.category} not found.`;
        } else {
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
        }
        next(err);
    }
});

app.get("/single/:id", async (req, res, next) => {
    let prodId = req.params.id.toLowerCase();
    try {
        let prods = await fs.readFile("product_info/all_prods.json");
        let prodsJson = JSON.parse(prods);
        let notFoundProd = true;
        prodsJson.products.forEach(product => {
            if (product.id.toLowerCase() == prodId){
                notFoundProd = false;
                res.json(product);
            }
        });
        if (notFoundProd){
            throw new TypeError();
        }
    } catch (err) {
        if (err instanceof TypeError) {
            res.status(CLIENT_ERR_CODE);
            err.message = `Product ID ${req.params.id} not found.`;
        } else {
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
        }
        next(err);
    }
});

app.get("/faqs", async (req, res, next) => {
    try {
        let faqs = await fs.readFile("product_info/faqs.json");
        let faqsJson = JSON.parse(faqs);
        res.json(faqsJson);
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.get("/promos", async (req, res, next) => {
    try {
        let promos = await fs.readFile("product_info/promos.json");
        let promosJson = JSON.parse(promos);
        res.json(promosJson);
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.post("/info", async (req, res, next) => {
    try {
        console.log(req.body);
        res.type("text");
        let name = req.body.name;
        let email = req.body.email;
        let feedback = req.body.feedback;
        let phone = req.body.phone;
        let data = {
            "name": name,
            "email": email,
            "feedback": feedback,
            "phone": phone
        };
        let jsonFile = "product_info/cust_serv.json";
        try {
            let contents = await fs.readFile(jsonFile, "utf8");
            contents = JSON.parse(contents);
            contents.form_submissions.push(data);
            try {
                await fs.writeFile(jsonFile, JSON.stringify(contents, null, 2), "utf8");
                res.send(`Request to add ${name}/'s feedback successfully received!`);
            } catch (err) {
                res.status(SERVER_ERR_CODE);
                err.message = SERVER_ERROR;
                next(err);
            }
        } catch (err) {
            if (err.code !== "ENOENT") { // file-not-found error
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
            next(err);
            }
        }
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

/**
 * Error-handling middleware to help cleanly handle different types of errors. 
 * In the case of this API, this middleware function will help to handle the 400 (client-side)
 * vs 500 (server-side) errors. 
 * Always outputs the error as a text response with the specified error message.
 * @param {Object} err - The error object with the desired error message
 * @param {Object} req - The user-specified request
 * @param {Object} res - The response to be outputted to the user
 * @param {Object} next - The next param for all middleware functions
 */
function errorHandler(err, req, res, next) {
    res.type("text");
    res.send(err.message);
}

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});