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

/**
 * Returns a JSON list of dictionaries from the all_prods.json file in the product_info folder
 * containing the stored product information (image url, product name, monthly price,
 * category, product id, and product description) for all products.
 * Example: "[{"image" : "...", "name" : "...","price" : "...","category" : "...","id" : "...","description" : "..."}]"
 * Responds with a 500 error if an error occurred in  in reading the all_prods.json file.
 */
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

/**
 * Returns a JSON dictionary with an entry containing a list dictionaries for 
 * all products from the all_prods.json file that match the given filtering category, 
 * containing the stored data for each.
 * Example: "{"products" : [{"image" : "...",...}, {"image" : "...",...}, {"image" : "...",...}]}"
 * Responds with a 400 error if the provided category for filtering is not found.
 * Responds with a 500 error if an error occurred in reading the all_prods.json file.
 */
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
            res.status(CLIENT_ERR_CODE);
            next(Error(`Category ${req.params.category} not found.`));
        }
        else {
            res.json({"products": filteredProds});
        }
        
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

/**
 * Returns a JSON dictionary from the all_prods.json file in the product_info folder
 * containing the stored product information for a single product, given its 
 * product id.
 * Example: "{"image" : "...", "name" : "...","price" : "...","category" : "...","id" : "...","description" : "..."}"
 * Responds with a 400 error if the product id cannot be found in all_prods.json
 * Responds with a 500 error if an error occurred in reading the all_prods.json file.
 */
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
            res.status(CLIENT_ERR_CODE);
            next(Error(`Product ID ${req.params.id} not found.`));
        }
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

/**
 * Returns a JSON dictionary containing a list of dictionaries for 
 * all frequently asked questions with
 * an entry for the question and an entry for the answer.
 * Example: "{"faqs": [{"Question": "...", "Answer": "..."}, {"Question": "...", "Answer": "..."}]}"
 * Responds with a 500 error if an error occurred in reading the faqs.json file.
 */
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

/**
 * Returns a JSON dictionary containing a list of dictionaries 
 * for all promotions from the 
 * promos.json file in the product_info folder.
 * Example: "{"promos": [{"start date": "...","end date": "...","sale description": "..."}]}"
 * Responds with a 500 error if an error occurred in reading the promos.json file.
 */
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

/**
 * Accepts data via a POST request from the contact form. The request must contain
 * the name, email, and feedback parameters, with an optional phone parameter. If
 * parameters pass, the data is stored in a dictionary and added to the cust_serv.json
 * file in the product_info folder. Returns a plain text success or failure message.
 * Example: "Request to add Eric's feedback successfully received!"
 * Responds with a 400 error if any of the name, email, or feedback parameters are mising
 * Responds with a 500 error if the cust_serv.json file cannot be read from
 * Responds with a 500 error if the cust_serv.json file cannot be written to
 */
// NOTE: Used the code from lecture 18 slide 41 as a template for a POST endpoint
app.post("/info", async (req, res, next) => {
    res.type("text");
    let name = req.body.name;
    let email = req.body.email;
    let feedback = req.body.feedback;
    let phone = req.body.phone;

    if (!(name && email && feedback)) {
        res.status(CLIENT_ERR_CODE);
        next(Error("Did not include all POST parameters of name, email, and feedback!"));
    }
    else {
        if (!phone) {
            phone = "";
        }
        let data = {
            "name": name,
            "email": email,
            "feedback": feedback,
            "phone": phone
        };
        let jsonFile = "product_info/cust_serv.json";
        let contents = null;
        try {
            contents = await fs.readFile(jsonFile, "utf8");
        } catch (err) {
            if (err.code !== "ENOENT") { // file-not-found error
                res.status(SERVER_ERR_CODE);
                err.message = SERVER_ERROR;
                next(err);
            }
        }
        if(contents) {
            contents = JSON.parse(contents);
        }
        else {
            contents = {"form_submissions":[]};
        }
        contents.form_submissions.push(data);
        try {
            await fs.writeFile(jsonFile, JSON.stringify(contents, null, 2), "utf8");
            res.send(`Request to add ${name}'s feedback successfully received!`);
        } catch (err) {
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
            next(err);
        }
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