const script = document.createElement('script');
script.src = 'https://unpkg.com/axios/dist/axios.min.js';
document.head.appendChild(script);

const wrapper = document.getElementById('238596');
const prerequisites = wrapper.querySelector('.prerequisites');

// Create a new button element
const newButton = document.createElement('button');
newButton.textContent = 'Download';

// Append the new button as a child of the wrapper element, before the existing button
wrapper.insertBefore(newButton, prerequisites);

const get_module = async (data_module_url) => {

    //const response = await axios.get(`https://camino.instructure.com/api/v1${data_module_url}/items`);
    const response = await axios.get(`https://camino.instructure.com/api/v1/courses/90320/modules/${data_module_url}/items`);
    const data = response.data;
    return data;
}

// Downloads separate pdfs
const get_pdfs = async (data_module_url) => {
    const data = await get_module(data_module_url);

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

// Listen for click on button
newButton.addEventListener('click', () => {
    get_pdfs(wrapper.id);
});
