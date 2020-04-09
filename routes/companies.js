const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.use(express.json());

// get all companies from database return {companies: [{code, name}, ...]}
router.get("/", async function(req, res, next){
  try{
    const results = await db.query(
      `SELECT code, name 
       FROM companies`
       );

    return res.json(results.rows);
  }
  catch (err){
    return next(err);
  }
});

// get one company from database return {company: {code, name, description}}
router.get('/:code', async function(req, res, next){
  try{
    const code = req.params.code;
    
    const results = await db.query(
      `SELECT c.code, c.name, c.description, i.id
      FROM companies AS c
      FULL JOIN invoices AS i
      ON c.code = i.comp_code
      WHERE c.code = $1`, [code]
       );
       
    if(results.rows.length === 0){
      throw new ExpressError(`${code} does not exist!`, 404);
    }

    const companyInvoices = results.rows;

    let ids = companyInvoices.map(company => company.id);
    if ( ids[0] === null ) {
      ids = [];
    }
    results.rows[0].invoices = ids;
    delete results.rows[0].id;

    return res.json({company: results.rows[0]});
  }
  catch (err){
    return next(err);
  }
});

// create a company, return {company: {code, name, description}}
router.post('/', async function(req, res, next){
  try{

    const {code, name, description} = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`, 
      [code, name, description]
    );

    return res.status(201).json({company: result.rows[0]});
  }
  catch(err){
    return next(err);
  }
});

// update a company, return {company: {code, name, description}}
router.put('/:code', async function(req, res, next){
  try{
    const {name, description} = req.body;
    const code = req.params.code;

    const result = await db.query(
      `UPDATE companies 
      SET name=$1, description=$2
      WHERE code=$3
      RETURNING name, description, code`, 
      [name, description, code]
    );

    if(result.rows.length === 0){
      throw new ExpressError(`update failed, ${code} does not exist!`, 404);
    }

    return res.json({company: result.rows[0]})
  }
  catch(err){
    return next(err);
  }
});

// delete a company, return {status: "deleted"}
router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
        `DELETE FROM companies 
        WHERE code = $1
        RETURNING code`,
        [req.params.code]
    );
    
    if (result.rows.length == 0) {
      throw new ExpressError(`delete failed, ${code} does not exist`, 404)
    } else {
      return res.json({status: "deleted"});
    }
  }
  catch (err) {
    return next(err);
  }
});



module.exports = router;