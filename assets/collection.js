function updateGridAlignment() {
    const grids = document.querySelectorAll('.subcollection-grid');

    grids.forEach(grid => {
        if (grid.scrollWidth > grid.clientWidth) {
            grid.style.justifyContent = 'flex-start';
        } else {
            grid.style.justifyContent = 'center';
        }
    });
}

updateGridAlignment();
window.addEventListener('resize', updateGridAlignment);