// Конфигурация Supabase
const SUPABASE_URL = 'https://hocudyimgknwaitlsagk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vpdM56mSm1zukhIXNCPQkg_6vM9qxMH';

// Инициализация
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Элементы DOM
const status = document.getElementById('status');
const list = document.getElementById('list');
const form = document.getElementById('add-form');

// Загрузка данных
async function loadData() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayData(data);
        status.textContent = `✅ Загружено ${data.length} лекарств`;
        status.className = 'success';
    } catch (err) {
        status.textContent = `❌ Ошибка: ${err.message}`;
        status.className = 'error';
    }
}

// Отображение данных
function displayData(items) {
    if (!items || items.length === 0) {
        list.innerHTML = '<p>Нет лекарств. Добавьте первое!</p>';
        return;
    }
    
    list.innerHTML = items.map(item => `
        <div class="item">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description || 'Нет описания')}</p>
            <div class="meta">
                <span class="price">${item.price} ₽</span>
                <span>${item.quantity} шт.</span>
                <span>${item.category}</span>
            </div>
            ${item.expiry_date ? `<small>Годен до: ${new Date(item.expiry_date).toLocaleDateString()}</small>` : ''}
        </div>
    `).join('');
}

// Добавление нового лекарства
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const item = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value) || 0,
        quantity: parseInt(document.getElementById('quantity').value) || 1,
        category: document.getElementById('category').value,
        expiry_date: document.getElementById('expiry_date').value || null
    };
    
    try {
        const { error } = await supabase
            .from('products')
            .insert([item]);
        
        if (error) throw error;
        
        form.reset();
        await loadData();
        alert('✅ Лекарство добавлено!');
    } catch (err) {
        alert(`❌ Ошибка: ${err.message}`);
    }
});

// Вспомогательная функция
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Загружаем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', loadData);
