function parseDate(dateStr) {
    const [year, era] = dateStr.split(' ');
    let numericYear = parseInt(year);
    if (era === 'BC') {
        numericYear = -numericYear;
    }
    return new Date(numericYear, 0, 1);
}

function prepareData(results) {
    const dynastyColors = {};
    results.data.forEach(row => {
        if (row.type === 'dynasty' && row.color) {
            dynastyColors[row.id] = row.color; // Use CSV color directly
        }
    });

    const sortedDynasties = results.data
        .filter(row => row.type === 'dynasty')
        .sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date))
        .map((row, index) => ({ id: row.id, order: index }));

    const dynastyOrder = {};
    sortedDynasties.forEach(d => {
        dynastyOrder[d.id] = d.order;
    });

    const allItems = results.data
        .filter(row => row.start_date)
        .map(function(row) {
            let item = {
                id: row.id,
                content: row.name,
                start: parseDate(row.start_date),
                type: row.type === 'event' ? 'point' : 'range',
                significance: parseInt(row.significance),
                itemType: row.type,
                description: row.description || 'No description available.'
            };

            const dynastyId = row.dynasty_id || 'none';
            const dynastyColor = dynastyColors[dynastyId] || '#666';
            const dynastyIndex = dynastyOrder[dynastyId] !== undefined ? dynastyOrder[dynastyId] : 999;
            const dynastyName = dynastyId !== 'none' ? results.data.find(d => d.id === dynastyId)?.name || 'Unknown' : null;

            if (row.type === 'dynasty' && row.end_date) {
                item.end = parseDate(row.end_date);
                item.style = 'background-color: ' + dynastyColors[row.id] + '; color: white;';
                item.className = 'dynasty';
                item.group = 'main';
                item.order = dynastyIndex * 1000;
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
                item.order = 10000 + parseInt(row.id);
            } else if (row.type === 'scholar' && row.end_date) {
                item.end = parseDate(row.end_date);
                item.className = 'scholar';
                item.style = 'border-color: #8B4513; color: #8B4513;';
                item.group = 'scholars';
                item.order = parseInt(row.id);
            }

            let tooltipContent = `<strong>${row.name}</strong><br>`;
            tooltipContent += `Years: ${row.start_date}${row.end_date ? ' - ' + row.end_date : ''}<br>`;
            if (row.image) {
                tooltipContent += `<img src="${row.image}" style="max-width: 100px;"><br>`;
            }
            if (dynastyName) {
                tooltipContent += `Dynasty: ${dynastyName}<br>`;
            }
            tooltipContent += `Description: ${row.description}`;
            item.title = tooltipContent;

            return item;
        });

    return allItems;
}

Papa.parse('iran_history.csv', {
    download: true,
    header: true,
    complete: function(results) {
        window.allItems = prepareData(results);
        initTimeline();
    },
    error: function(error) {
        console.error('Error loading CSV:', error);
        document.getElementById('visualization').innerHTML = '<p>Error: Could not load CSV data.</p>';
    }
});
