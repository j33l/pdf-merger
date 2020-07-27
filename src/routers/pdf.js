const express = require('express')
const multer = require('multer')
const PDFMerger = require('pdf-merger-js')

const fs = require('fs')
const path = require('path')

const pdfsPath = path.join(__dirname, '../public/pdfs')

const router = new express.Router()

const removeFile = (path) => {
    // fs.unlink(path, (err) => { // async.
    //     if (err) {
    //         return console.error(err)
    //     }
    // })
    try {
        fs.unlinkSync(path)
    } catch(e) {
        console.log('\n\n remove file error \n\n', e)
    }
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
router.post('/merge', upload.array('pdfs'), async (req, res) => {
    try {
        var merger = new PDFMerger()

        req.files.forEach(file => {
            merger.add(file.filename)
        })

        const mergedPDF = 'merged_pdf_by_merger.pdf'

        await merger.save(mergedPDF) //save under given name
        
        res.download(mergedPDF)

        // removing after merge is completed
        req.files.forEach(file => {
            removeFile(file.filename)
        })

        // removeFile(path.join(__dirname, mergedPDF)) // removing old merged file
        
    } catch (error) {
        console.log('\n\n try block error \n\n', error)
        res.send({ error })
    }
}, (error, req, res, next) => {
    console.log('\n\n 3rd arg cb error \n\n', error)
    res.status(400).send({error: error.message})
})

module.exports = router
