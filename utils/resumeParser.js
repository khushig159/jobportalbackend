const fs=require('fs')
const pdfParse=require('pdf-parse')
const mammoth=require('mammoth')

async function extractTextFromResume(filePath){
    if(filePath.endsWith('.pdf')){
        const dataBuffer=fs.readFileSync(filePath)
        const data=await pdfParse(dataBuffer);
        return data.text
    }
    else if(filePath.endsWith('.docx')){
        const result=await mammoth.extractRawText({path:filePath})
        return result.value
    }
    else{
        throw new Error("Unsupported file format. Upload PDF or DOCX.");
    }
}
module.exports = extractTextFromResume;
