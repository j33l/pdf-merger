const express = require('express')
const multer = require('multer')
const fs = require('fs')

const PDFMerger = require('pdf-merger-js')

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
      callback(null, './pdfs');
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

// `single()` arg.-`uploadzk` is file name multer will look for when request comes in to server
router.post('/merge', upload.array('pdfs', 2), async (req, res) => {
    
    let pdf1_path = req.files[0].path
    let pdf2_path = req.files[1].path
    const mergedPDF = 'merged_pdf_by_merger.pdf'

    merger.add(pdf1_path)
    merger.add(pdf2_path)
    await merger.save(mergedPDF); //save under given name

    removeFile(pdf1_path)
    removeFile(pdf2_path)

    res.download(mergedPDF)
    // removeFile(mergedPDF)
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

module.exports = router
