const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.use(express.json());

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


module.exports = router;