# pdf-merger-api (v3.0.1)

- Only allowed PDF, DOC and DOCX files.

### operations
1. File uploading from client  
    a. storing on server  
2. converting DOC to PDF  
    a. uploading DOC to iva server  
        i. converting  
    b. downloading file data  
3. Merging PDFs  
    a. storing on server  
4. Embading number  
    a. storing on server  
5. Sending download file  

### local setup
- > npm install
- create env file : /config/dev.env  
    `PORT`  
    `IVA_CONVERTER_API_KEY`
- > npm run dev

#### TODO: 
1. Cleaning code and structure
2. Good UI/UX
    - Upload indicator
    - download indicator
3. speed improvement
