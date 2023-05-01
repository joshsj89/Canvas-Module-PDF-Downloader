// Gets the current URL
const currentURL = window.location.href;

// Extracts the domain name
const domain = currentURL.match(/https:\/\/.+.com/)[0]; //https://*.instructure.com

// Extracts the course ID from the URL
const course_id_arr = currentURL.match(/courses\/(\d+)/);
if (course_id_arr) {
    var course_id = course_id_arr[1];
}


/***************************************************************/
//Module PDF Downloader

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
    const response = await axios.get(`${domain}/api/v1/courses/${course_id}/modules/${module_id}/items`);
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
            console.log(`"${filename}" downloaded successfully.`);
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

/***************************************************************/
// Page Files Downloader

// Wait for 'Alternative Formats' button to show up
window.addEventListener('load', () => {
    // Find 'Alternative Formats' button
    const targetElement = document.querySelector('button.ally-accessible-versions');
    // Create a new button
    const newButton = document.createElement('a');
    newButton.href = '#';
    newButton.role = 'button';
    newButton.tabindex = '0';
    newButton.classList.add('al-trigger');
    newButton.setAttribute('aria-haspopup', 'true');
    
    const imgElement = document.createElement('img');
    imgElement.style.width = '16px';
    imgElement.style.height = '16px';
    imgElement.src = '/images/svg-icons/svg_icon_download.svg';
    imgElement.alt = '';
    imgElement.role = 'presentation';
    newButton.appendChild(imgElement);
    
    const spanElement = document.createElement('span');
    spanElement.classList.add('screenreader-only');
    spanElement.textContent = 'Download all files on this page';
    newButton.appendChild(spanElement);

    // Insert new button right after 'Alternative Formats' button
    if (targetElement) {
        targetElement.insertAdjacentElement('afterend', newButton);
    }

    // When the new button is clicked, open all the files' download links
    newButton.addEventListener('click', () => {
        const files = document.querySelectorAll('[data-api-returntype="File"]');

        files.forEach(async (file) => {
            const data_id = file.getAttribute('data-id');
            const title = file.getAttribute('title');
            const url = `${domain}/courses/${course_id}/files/${data_id}/download?download_frd=1`;
            window.open(url, '_blank');
            console.log(`${title} downloaded successfully.`);
        });
    })
});