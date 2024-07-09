import axios from 'axios';
import JSZip from 'jszip';
import * as PDFLib from 'pdf-lib';

// Gets the current URL
const currentURL: string = window.location.href;

// Extracts the domain name
const domainRegEx: RegExpMatchArray | null = currentURL.match(/https:\/\/.+.com/); //https://*.instructure.com
if (domainRegEx) {
    var domain: string = domainRegEx[0];
}

// Extracts the course ID from the URL
const course_id_arr: RegExpMatchArray | null = currentURL.match(/courses\/(\d+)/);
if (course_id_arr) {
    var course_id: string = course_id_arr[1];
}

interface CanvasModule {
    content_id: number;
    html_url: string;
    id: number;
    indent: number;
    module_id: number;
    position: number;
    quiz_lti: boolean;
    title: string;
    type: string;
    url: string;
}

interface CanvasFile {
    "id": number;
    "uuid": string;
    "folder_id": number;
    "display_name": string; // "10-23 Notes.pdf"
    "filename": string; // "10-23+Notes.pdf"
    "upload_status": string; // "success"
    "content-type": string; // "application/pdf";
    "url": string; // "https://camino.instructure.com/files/7531550/download?download_frd=1"
    "size": number;
    "created_at": string; // "2023-10-24T21:35:02Z"
    "updated_at": string; // "2023-10-27T19:00:33Z"
    "unlock_at": null;
    "locked": boolean;
    "hidden": boolean;
    "lock_at": null;
    "hidden_for_user": boolean;
    "thumbnail_url": null;
    "modified_at": string; // "2023-10-24T21:35:02Z"
    "mime_class": string; // "pdf"
    "media_entry_id": null;
    "category": string; // "uncategorized"
    "locked_for_user": boolean;
    "visibility_level": string; // "inherit"
    "canvadoc_session_url": string; // "/api/v1/canvadoc_session?blob=%7B%22user_id%22:17880000000062308,%22attachment_id%22:7531550,%22type%22:%22canvadoc%22%7D&hmac=59a94d6d352d2da29f57d9a29fbcdf14e712f729";=
    "crocodoc_session_url": null;
}

/***************************************************************/
//Module PDF Downloader

const modules: NodeListOf<Element> = document.querySelectorAll('.ig-header');

modules.forEach((module: Element): void => {
    // Create a new button element
    const downloadSeparateButton: HTMLButtonElement = document.createElement('button');
    downloadSeparateButton.textContent = 'Download Separate';

    const downloadMergedButton: HTMLButtonElement = document.createElement('button');
    downloadMergedButton.textContent = 'Download Merged';

    module.appendChild(downloadSeparateButton);
    module.appendChild(downloadMergedButton);

    const name: string | null | undefined = module.querySelector('.name')?.textContent;

    if (!name) {
        console.log('Error: Module name not found.');
        return;
    }

    // Listen for click on button
    downloadSeparateButton.addEventListener('click', () => {
        get_pdfs(module.id, name);
    });
    
    downloadMergedButton.addEventListener('click', () => {
        get_pdf(module.id, name);
    });
});


const get_module = async (module_id: string): Promise<CanvasModule[]> => {
    const response = await axios.get(`${domain}/api/v1/courses/${course_id}/modules/${module_id}/items`);
    const data: CanvasModule[] = await response.data;
    return data;
}

// Downloads separate pdfs
const get_pdfs = async (module_id: string, name: string): Promise<void> => {
    const zip: JSZip = new JSZip();
    
    const data: CanvasModule[] = await get_module(module_id);

    for (const info of data) {
        const url = info['url'];
        const response = await axios.get(url);
        const data2: CanvasFile = await response.data;
        const filename: string = data2['display_name'];
        const url2: string = data2['url'];

        if (data2['content-type'] === 'application/pdf') {
            const response2 = await axios.get(url2, { responseType: 'arraybuffer' });
            const blob: Blob = new Blob([response2.data]);
            
            zip.file(filename, blob);
            console.log(`"${filename}" added to zip successfully.`);
        }
    }
    
    try {
        const zipFilename: string = `${name}.zip`;
        const content = await zip.generateAsync({ type: 'blob' });
        // const blob = new Blob([content]);
        const link: HTMLAnchorElement = document.createElement('a');
        link.href = window.URL.createObjectURL(content);
        link.download = zipFilename;
        link.click();
        console.log(`"${zipFilename}" created successfully.`);
    
        setTimeout(() => {
            window.URL.revokeObjectURL(link.href);
        }, 100);
    } catch (error) {
        console.log(error);
    }
}

// Downloads multiple pdfs and combines them into one
const get_pdf = async (module_id: string, name: string) => {
    const data: CanvasModule[] = await get_module(module_id);
    
    const sourcePDFDoc: PDFLib.PDFDocument = await PDFLib.PDFDocument.create();
    for (const info of data) {
        const url: string = info['url'];
        const response = await axios.get(url);
        const data2 = await response.data;
        const url2: string = data2['url'];
        
        if (data2['content-type'] === 'application/pdf') {
            const response2 = await axios.get(url2, { responseType: 'arraybuffer' });
            const appendedPDFDoc: PDFLib.PDFDocument = await PDFLib.PDFDocument.load(response2.data);
            
            for (let i = 0; i < appendedPDFDoc.getPageCount(); i++) {
                const [page] = await sourcePDFDoc.copyPages(appendedPDFDoc, [i]);
                sourcePDFDoc.addPage(page);
            }
            
            console.log(`"${data2['display_name']}" downloaded successfully.`);
        }
    }
    
    const filename: string = `${name}.pdf`;
    const combinedPDFBytes = await sourcePDFDoc.save();
    const blob: Blob = new Blob([combinedPDFBytes]);
    const link: HTMLAnchorElement = document.createElement('a');
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
    const targetElement: Element | null = document.querySelector('button.ally-accessible-versions');
    // Create a new button
    const newButton: HTMLAnchorElement = document.createElement('a');
    newButton.href = '#';
    newButton.role = 'button';
    newButton.tabIndex = 0;
    newButton.classList.add('al-trigger');
    newButton.setAttribute('aria-haspopup', 'true');
    
    const imgElement: HTMLImageElement = document.createElement('img');
    imgElement.style.width = '16px';
    imgElement.style.height = '16px';
    imgElement.src = '/images/svg-icons/svg_icon_download.svg';
    imgElement.alt = '';
    imgElement.role = 'presentation';
    newButton.appendChild(imgElement);
    
    const spanElement: HTMLSpanElement = document.createElement('span');
    spanElement.classList.add('screenreader-only');
    spanElement.textContent = 'Download all files on this page';
    newButton.appendChild(spanElement);

    // Insert new button right after 'Alternative Formats' button
    if (targetElement) {
        targetElement.insertAdjacentElement('afterend', newButton);
    }

    // When the new button is clicked, open all the files' download links
    newButton.addEventListener('click', () => {
        const files: NodeListOf<Element> = document.querySelectorAll('[data-api-returntype="File"]');

        files.forEach(async (file: Element): Promise<void> => {
            const data_id: string | null = file.getAttribute('data-id');
            const title: string | null = file.getAttribute('title');
            const url: string = `${domain}/courses/${course_id}/files/${data_id}/download?download_frd=1`;
            window.open(url, '_blank');
            console.log(`${title} downloaded successfully.`);
        });
    })
});