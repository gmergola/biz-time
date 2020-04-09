const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.use(express.json());

router.get('/', async function( req, res, next) {
  try{
    const results = await db.query(
      `SELECT id, comp_code 
       FROM invoices`
       );

    return res.json(results.rows);
  }
  catch (err){
    return next(err);
  }
});

// get one company from database
// returns Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
router.get('/:id', async function(req, res, next) {
  try {
    const id = req.params.id;

    const invoiceResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1`,
      [id]
    );
    
    if(invoiceResult.rows.length === 0){
      throw new ExpressError(`${code} does not exist!`, 404);
    }

    let comp_code = invoiceResult.rows[0].comp_code;

    const companyResult = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [comp_code]
    );
    
    invoiceResult.rows[0].company = companyResult.rows[0];
    delete invoiceResult.rows[0].comp_code;
    
    return res.json({ invoice: invoiceResult.rows[0] });
  }
  catch (err) {
    return next(err);
  }
});

// adds new invoice to DB
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body;
  
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date
       `,
      [comp_code, amt]
    );
  
    return res.status(201).json({invoice: result.rows[0]})
  }
  catch (err) {
    return next(err);
  }
});

// updates an invoice on the DB
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async function(req, res, next) {
  try {
    const amt = req.body.amt;
    const id = req.params.id;

    const result = await db.query(
      `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );

    if(result.rows.length === 0){
      throw new ExpressError(`update failed, invoice ${id} does not exist!`, 404);
    }

    return res.json({invoice: result.rows[0]});
  }
  catch (err) {
    return next(err);
  }
});

// deletes an invoice from the db, Returns: {status: "deleted"}
router.delete('/:id', async function(req, res, next) {
  try {
    const id = req.params.id;

    const result = await db.query(
      `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`,
      [id]
      );
      if (result.rows.length == 0) {
        throw new ExpressError(`delete failed, ${id} does not exist`, 404)
      } else {
        return res.json({status: `deleted ${result.rows[0].id}`});
      }
  }
  catch (err) {
    return next(err);
  }
});



module.exports = router;