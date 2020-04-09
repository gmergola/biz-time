const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.use(express.json());

// get all companies from database return with json
router.get("/", async function(req, res, next){
  try{
    const results = await db.query(
      `SELECT code, name 
       FROM companies`
       );

    return res.json(results.rows);
  }catch (err){
    return next(err);
  }
});

// get one company from database return with json
router.get('/:code', async function(req, res, next){
  try{
    const code = req.params.code;
    
    const results = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code=$1`, [code]
       );
    
    if(results.rows.length === 0){
      throw new ExpressError(`${code} does not exist!`, 404);
    }
    return res.json({company: results.rows[0]});

  }catch (err){
    return next(err);
  }
});

// create a company, return with json
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

  }catch(err){
    return next(err);
  }
});

// update a company, return with json
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
  }catch(err){
    return next(err);
  }
});

// delete a company, return with json
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
      return res.json({message: "deleted"});
    }
  }

  catch (err) {
    return next(err);
  }
});



module.exports = router;