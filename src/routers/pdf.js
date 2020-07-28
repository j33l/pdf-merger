const express = require('express')
const multer = require('multer')

const PDFMerger = require('pdf-merger-js') // to merge multiple pdfs into single pdf
const { docxToPdfFromPath, initIva, convertDocxToPDFFromFile } = require("iva-converter") // to convert DOC into PDF

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib') // to embade page number in PDF

const fs = require('fs')
const path = require('path')

// used to save converted DOC
// const { writeFileSync } = require("fs")
// const { basename } = require("path")

const pdfsPath = path.join(__dirname, '../public/pdfs')

const router = new express.Router()

// GET YOUR API KEY AT https://app.iva-docs.com/auth/register
initIva(process.env.IVA_CONVERTER_API_KEY)

/**
 * 
 * @param {path of the file to be removed} path 
 * 
 * returns nothing, just removes the specified file
 */
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

/**
 * 
 * @param {array to loop through} array 
 * @param {callback function to run after process is completed} callback 
 * 
 * reference : https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
 */
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

/**
 * 
 * @param {path of the pdf file} pdfFile 
 * 
 * returns nothing, just saves new pdf file with embaded numbers
 * 
 * reference : http://thecodebarbarian.com/working-with-pdfs-in-node-js.html
 */
async function embeddingPageNumber(pdfFile) {
    const content = await PDFDocument.load(fs.readFileSync(pdfFile));
  
    // Add a font to the doc
    const helveticaFont = await content.embedFont(StandardFonts.Helvetica);
  
    // Draw a number at the bottom of each page.
    // Note that the bottom of the page is `y = 0`, not the top
    const pages = await content.getPages();
    for (const [i, page] of Object.entries(pages)) {
      page.drawText(`${+i + 1}`, {
        x: page.getWidth() / 2,
        y: 10,
        size: 15,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
    }
  
    // Write the PDF to a file
    fs.writeFileSync('./final_numbered.pdf', await content.save());

    // return await content.save() // Uint8Array
}

/**
 * 
 * @param {DOC file path} filePath 
 * 
 * converts the specified DOC file into PDF and `then` is called with converted PDF file data
 */
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

/**
 * disk storage object for multer
 * specifies storage destination and filename
 */
var storage = multer.diskStorage({
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

/**
 * upload middleware for multer
 * 
 * includes file type filter and storage object
 */
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
 * API route to murge multiple PDFs into single PDF and downloads it to the client machine
 * 
 * It performs DOC to PDF conversion, page number embading for final murged pdf
 */
router.post('/merge', upload.array('files'), async (req, res) => {
    try {
        var merger = new PDFMerger()

        // converting DOC into PDF before merging
        await asyncForEach(req.files, async (file) => {
            let pdfFile = file.path
            if(file.originalname.match(/\.(docx|doc)$/)) {
                pdfFile = await convertDocToPdf(file.path)
            }
            merger.add(pdfFile)
        })

        const embadedpagenumber = req.body.embadedpagenumber

        const mergedPDF = 'merged_pdf_by_merger.pdf'

        await merger.save(mergedPDF) //save under given name

        if(embadedpagenumber) {
            // const finalPdf = 
            await embeddingPageNumber(mergedPDF) // embedding Page Numbers
            res.download('./final_numbered.pdf')
            // res.send(Buffer.from(finalPdf))
        } else {
            res.download(mergedPDF)
        }

        // res.send(finalPdf)

        // removing after merge is completed
        req.files.forEach(file => {
            removeFile(file.filename)
        })

        //TODO: remove final files `merged_pdf.pdf` and `final_numbered.pdf` after sending
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
