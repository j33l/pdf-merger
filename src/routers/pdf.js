const express = require('express')
const multer = require('multer')
const PDFMerger = require('pdf-merger-js')

const fs = require('fs')
const path = require('path')

const pdfsPath = path.join(__dirname, '../public/pdfs')

var merger = new PDFMerger()

const router = new express.Router()

const removeFile = (path) => {
    fs.unlink(path, (err) => { // async.
        if (err) {
            return console.error(err)
        }
    })
}

var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
    //   callback(null, pdfsPath);
    //   callback(null, './public/pdfs');
      callback(null, './');
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now() + '.pdf');
    }
})

const upload = multer({ // multer configuration options
    // dest: 'pdfs', // destination path
    storage,
    fileFilter(req, file, cb) {
        if(!file.originalname.endsWith('.pdf')) {
            return cb(new Error(('File type is invalid!')))
        }

        cb(undefined, true)
    }
})

/**
 * downloads the merged pdf for user
 */
router.post('/merge', upload.array('pdfs', 2), async (req, res) => {
    // let pdf1_path = path.join(pdfsPath, req.files[0].filename)
    // let pdf2_path = path.join(pdfsPath, req.files[1].filename)
    let pdf1_path = req.files[0].filename
    let pdf2_path = req.files[0].filename

    const mergedPDF = 'merged_pdf_by_merger.pdf'

    merger.add(pdf1_path)
    merger.add(pdf2_path)
    await merger.save(mergedPDF); //save under given name

    // removing old files after merge is completed
    removeFile(pdf1_path)
    removeFile(pdf2_path)

    res.download(mergedPDF)
    // removeFile(mergedPDF)
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

module.exports = router
