const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    contents.forEach(c => c.classList.remove('active'));
    document.getElementById(`content-${tab.dataset.tab}`).classList.add('active');
  });
});
