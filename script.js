const axios_script = document.createElement('script');
axios_script.src = 'scripts/axios.min.js';
const pdf_lib = document.createElement('script');
pdf_lib.src = 'scripts/pdf-lib.min.js';

document.head.appendChild(axios_script);
document.head.appendChild(pdf_lib);

const modules = document.querySelectorAll(".ig-header");

modules.forEach((module) => {
    // Create a new button element
    const downloadSeparateButton = document.createElement('button');
    downloadSeparateButton.textContent = 'Download Separate';

    const downloadMergedButton = document.createElement('button');
    downloadMergedButton.textContent = 'Download Merged';

    module.appendChild(downloadSeparateButton);
    module.appendChild(downloadMergedButton);

    // Listen for click on button
    downloadSeparateButton.addEventListener('click', () => {
        get_pdfs(module.id);
    });
    
    downloadMergedButton.addEventListener('click', () => {
        const name = module.querySelector('.name').innerHTML;
        
        get_pdf(module.id, name);
    });
});

const get_module = async (module_id) => {
    const response = await axios.get(`https://camino.instructure.com/api/v1/courses/90320/modules/${module_id}/items`);
    const data = response.data;
    return data;
}

// Downloads separate pdfs
const get_pdfs = async (module_id) => {
    const data = await get_module(module_id);

    for (const info of data) {
        const url = info['url'];
        const response = await axios.get(url);
        const data2 = response.data;
        const filename = data2['display_name'];
        const url2 = data2['url'];

        if (data2['content-type'] === 'application/pdf') {
            const response2 = await axios.get(url2, { responseType: 'arraybuffer' });
            const blob = new Blob([response2.data]);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            console.log(`"${data2['display_name']}" downloaded successfully.`);
        }
    }
}

// Downloads multiple pdfs and combines them into one
const get_pdf = async (module_id, name) => {
    const data = await get_module(module_id);
    
    const sourcePDFDoc = await PDFLib.PDFDocument.create();
    for (const info of data) {
        const url = info['url'];
        const response = await axios.get(url);
        const data2 = response.data;
        const url2 = data2['url'];
        
        if (data2['content-type'] === 'application/pdf') {
            const response2 = await axios.get(url2, { responseType: 'arraybuffer' });
            const appendedPDFDoc = await PDFLib.PDFDocument.load(response2.data);
            
            for (let i = 0; i < appendedPDFDoc.getPageCount(); i++) {
                const [page] = await sourcePDFDoc.copyPages(appendedPDFDoc, [i]);
                sourcePDFDoc.addPage(page);
            }
            
            console.log(`"${data2['display_name']}" downloaded successfully.`);
        }
    }
    
    const filename = `${name}.pdf`;
    const combinedPDFBytes = await sourcePDFDoc.save();
    const blob = new Blob([combinedPDFBytes]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    console.log(`"${filename}" created successfully.`);
}