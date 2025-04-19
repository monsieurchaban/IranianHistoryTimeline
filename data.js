// List of CSV files to load
const csvFiles = [
    'data/dynasties.csv',
    'data/kings.csv',
    'data/scholars.csv',
    'data/events.csv'
];

// Function to load a single CSV file
function loadCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            download: true,
            header: true,
            complete: function(results) {
                // Assign IDs to each row
                const dataWithIds = results.data.map((row, index) => ({
                    ...row,
                    id: `${file.split('/').pop().split('.')[0]}-${index}` // e.g., 'dynasties-0', 'kings-1'
                }));
                resolve(dataWithIds);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

// Load all CSV files and combine their data
Promise.all(csvFiles.map(file => loadCSV(file)))
    .then(results => {
        // Combine all data arrays into one
        const combinedData = results.flat();
        window.allItems = prepareData({ data: combinedData });
        initTimeline();
    })
    .catch(error => {
        console.error('Error loading CSV files:', error);
        document.getElementById('visualization').innerHTML = '<p>Error: Could not load CSV data.</p>';
    });

// Parse date strings into Date objects
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return new Date(0);
    }
    const [year, era] = dateStr.trim().split(' ');
    if (!year || !era || !['BC', 'AD'].includes(era)) {
        return new Date(0);
    }
    let numericYear = parseInt(year);
    if (isNaN(numericYear)) {
        return new Date(0);
    }
    let milliseconds;
    if (era === 'BC') {
        milliseconds = -numericYear * 365.25 * 24 * 60 * 60 * 1000;
    } else {
        milliseconds = numericYear * 365.25 * 24 * 60 * 60 * 1000;
    }
    const date = new Date(milliseconds);
    date.setUTCFullYear(era === 'BC' ? -numericYear : numericYear);
    date.setUTCMonth(0);
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

// Prepare data for the timeline
function prepareData(results) {
    if (!results.data || !Array.isArray(results.data)) {
        return [];
    }

    // Map dynasty names to their colors
    const dynastyColors = {};
    results.data.forEach(row => {
        if (row.type === 'dynasty' && row.color && row.name) {
            dynastyColors[row.name] = row.color;
        }
    });

    // Sort dynasties by start date to assign order
    const sortedDynasties = results.data
        .filter(row => row.type === 'dynasty' && row.name)
        .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
        .map((row, index) => ({ name: row.name, order: index }));

    const dynastyOrder = {};
    sortedDynasties.forEach(d => {
        dynastyOrder[d.name] = d.order;
    });

    const allItems = results.data
        .filter(row => !!row.start_date)
        .map(function(row) {
            let item = {
                id: row.id, // Use dynamically assigned ID
                content: row.name,
                start: parseDate(row.start_date),
                type: row.type === 'event' ? 'point' : 'range',
                significance: parseInt(row.significance) || 1,
                itemType: row.type,
                description: row.description || 'No description available.'
            };

            // Use dynasty_name for kings, fallback to 'none' if empty
            const dynastyName = row.dynasty_name || 'none';
            const dynastyColor = dynastyColors[dynastyName] || '#666';
            const dynastyIndex = dynastyOrder[dynastyName] !== undefined ? dynastyOrder[dynastyName] : 999;
            // For tooltips, use the dynasty name directly
            const tooltipDynasty = dynastyName !== 'none' ? dynastyName : null;

            if (row.type === 'dynasty' && row.end_date) {
                item.end = parseDate(row.end_date);
                item.style = 'background-color: ' + dynastyColors[row.name] + '; color: white;';
                item.className = 'dynasty';
                item.group = 'main';
                item.order = dynastyIndex * 1000;
                if (item.end && item.start.getTime() >= item.end.getTime()) {
                    item.end = new Date(item.start.getTime() + 24 * 60 * 60 * 1000);
                }
            } else if (row.type === 'king' && row.end_date) {
                item.end = parseDate(row.end_date);
                item.className = 'king';
                item.style = 'border-color: ' + dynastyColor + '; color: ' + dynastyColor + ';';
                item.group = 'main';
                item.order = dynastyIndex * 1000 + 1;
                if (row.image) {
                    item.content = '<img src="' + row.image + '">' + row.name;
                }
            } else if (row.type === 'event') {
                item.className = 'event';
                item.group = 'main';
                item.order = 10000 + parseInt(row.id.split('-')[1]); // Use index part of ID
            } else if (row.type === 'scholar' && row.end_date) {
                item.end = parseDate(row.end_date);
                item.className = 'scholar';
                item.style = 'border-color: #8B4513; color: #8B4513;';
                item.group = 'scholars';
                item.order = parseInt(row.id.split('-')[1]); // Use index part of ID
            }

            let tooltipContent = `<strong>${row.name}</strong><br>`;
            tooltipContent += `Years: ${row.start_date}${row.end_date ? ' - ' + row.end_date : ''}<br>`;
            if (row.image) {
                tooltipContent += `<img src="${row.image}" style="max-width: 100px;"><br>`;
            }
            if (tooltipDynasty) {
                tooltipContent += `Dynasty: ${tooltipDynasty}<br>`;
            }
            tooltipContent += `Description: ${row.description}`;
            item.title = tooltipContent;

            return item;
        });

    return allItems;
}