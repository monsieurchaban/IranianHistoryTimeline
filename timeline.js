function initTimeline() {
    if (typeof vis === 'undefined') {
        console.error('Vis.js failed to load.');
        document.getElementById('visualization').innerHTML = '<p>Error: Could not load timeline library.</p>';
        return;
    }

    var container = document.getElementById('visualization');

    const groups = [
        { id: 'main', content: '', className: 'main' },
        { id: 'scholars', content: '', className: 'scholars' }
    ];

    var options = {
        height: '600px',
        min: '1000 BC',
        max: '2000 AD',
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 3000,
        showCurrentTime: false,
        format: {
            minorLabels: {
                year: 'YYYY'
            }
        },
        groupHeightMode: 'fixed',
        groupOrder: function(a, b) {
            return a.id === 'main' ? -1 : 1;
        },
        tooltip: {
            followMouse: true, // Tooltip follows cursor
            overflowMethod: 'cap' // Ensures tooltip stays within view
        }
    };

    var groupDataset = new vis.DataSet(groups);
    var itemDataset = new vis.DataSet();

    var timeline = new vis.Timeline(container);
    timeline.setOptions(options);
    timeline.setGroups(groupDataset);
    timeline.setItems(itemDataset);

    timeline.setOptions({
        order: function(a, b) {
            return a.order - b.order;
        }
    });

    const showDynasties = document.getElementById('showDynasties');
    const showKings = document.getElementById('showKings');
    const showEvents = document.getElementById('showEvents');
    const showScholars = document.getElementById('showScholars');

    function updateVisibility() {
        const range = timeline.getWindow();
        const timeSpan = (range.end - range.start) / (1000 * 60 * 60 * 24 * 365);
        let minSignificance;

        if (timeSpan > 2000) minSignificance = 5;
        else if (timeSpan > 1000) minSignificance = 4;
        else if (timeSpan > 500) minSignificance = 3;
        else if (timeSpan > 100) minSignificance = 2;
        else minSignificance = 1;

        const visibleItems = window.allItems.filter(item => 
            item.significance >= minSignificance &&
            (
                (item.itemType === 'dynasty' && showDynasties.checked) ||
                (item.itemType === 'king' && showKings.checked) ||
                (item.itemType === 'event' && showEvents.checked) ||
                (item.itemType === 'scholar' && showScholars.checked)
            )
        );
        itemDataset.clear();
        itemDataset.add(visibleItems);
    }

    updateVisibility();

    timeline.on('rangechanged', updateVisibility);

    showDynasties.addEventListener('change', updateVisibility);
    showKings.addEventListener('change', updateVisibility);
    showEvents.addEventListener('change', updateVisibility);
    showScholars.addEventListener('change', updateVisibility);

    timeline.setOptions({
        zoomable: true,
        moveable: true,
        selectable: true
    });
}
