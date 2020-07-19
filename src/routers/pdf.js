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
router.post('/merge', upload.array('pdfs', 2), async (req, res) => {
    try {
        // let pdf1_path = path.join(pdfsPath, req.files[0].filename)
        // let pdf2_path = path.join(pdfsPath, req.files[1].filename)
        let pdf1_path = req.files[0].filename
        let pdf2_path = req.files[1].filename

        const mergedPDF = 'merged_pdf_by_merger.pdf'
        removeFile('./'+mergedPDF) // removing old merged file

        var merger = new PDFMerger()

        merger.add(pdf1_path)
        merger.add(pdf2_path)
        await merger.save(mergedPDF) //save under given name
        
        res.download(mergedPDF)

        // removing after merge is completed
        removeFile(pdf1_path)
        removeFile(pdf2_path)
    } catch (error) {
        console.log('\n\n try block error \n\n', error)
        res.send({ error })
    }
}, (error, req, res, next) => {
    console.log('\n\n 3rd arg cb error \n\n', error)
    res.status(400).send({error: error.message})
})

module.exports = router
