const express = require('express')
const multer = require('multer')

const PDFMerger = require('pdf-merger-js')
const { docxToPdfFromPath, initIva, convertDocxToPDFFromFile } = require("iva-converter")

const fs = require('fs')
const path = require('path')

const { writeFileSync } = require("fs")
const { basename } = require("path")

const pdfsPath = path.join(__dirname, '../public/pdfs')

const router = new express.Router()

// GET YOUR API KEY AT https://app.iva-docs.com/auth/register
initIva(process.env.IVA_CONVERTER_API_KEY)

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

// reference : https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

let convertDocToPdf = function(filePath) {
    return new Promise(function (resolve, reject) {
    
        docxToPdfFromPath(filePath)
            .then((pdfFile) => {
                // writeFileSync(basename(filePath).replace(".docx", ".pdf"), pdfFile); // storing on fileSys
                resolve(pdfFile)
            })
            .catch((err) => {
                if (err === 429 || err === 408) {
                    // Retry logic
                    console.log(err, 'fail, retry.')
                    reject(err + ': fail, retry.');
                }
            })
        
            // Using `docx-pdf` module
            // docxConverter(file.path, file.path+'.pdf',function(err,result) {
            //     if(err){
            //       console.log(err);
            //     }
        
            //     merger.add(file.path)
            //     console.log('result'+result);
            //   })
    })
}

var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
    //   callback(null, pdfsPath);
    //   callback(null, './public/pdfs');
      callback(null, './');
    },
    filename: function (req, file, callback) {
        // callback(null, file.fieldname + '-' + Date.now() + '.pdf');
       
        callback(null, file.originalname);
    }
})

const upload = multer({ // multer configuration options
    // dest: 'pdfs', // destination path
    storage,
    fileFilter(req, file, cb) {
        // if(!file.originalname.endsWith('.pdf')) {
        if(!file.originalname.match(/\.(pdf|docx|doc)$/)) {
            return cb(new Error(('File type is invalid!')))
        }

        cb(undefined, true)
    }
})

/**
 * downloads the merged pdf for user
 */
router.post('/merge', upload.array('files'), async (req, res) => {
    try {
        var merger = new PDFMerger()

        await asyncForEach(req.files, async (file) => {
            const pdfFile = await convertDocToPdf(file.path)
            merger.add(pdfFile)
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
