// Конфигурация Supabase (вставьте ваши ключи)
const SUPABASE_URL = 'https://hocudyimgknwaitlsagk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vpdM56mSm1zukhIXNCPQkg_6vM9qxMH';

// Инициализация клиента Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM элементы
const productsList = document.getElementById('products-list');
const addProductForm = document.getElementById('add-product-form');
const connectionStatus = document.getElementById('connection-status');

// Проверка подключения к Supabase
async function checkConnection() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        connectionStatus.textContent = '✅ Подключено к Supabase';
        connectionStatus.className = 'status connected';
        console.log('✅ Подключение к Supabase успешно');
        
        // Загружаем товары
        loadProducts();
    } catch (error) {
        console.error('❌ Ошибка подключения:', error);
        connectionStatus.textContent = '❌ Ошибка подключения к базе данных';
        connectionStatus.className = 'status error';
    }
}

// Загрузка товаров из базы данных
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        productsList.innerHTML = '<p class="error">❌ Ошибка загрузки данных</p>';
    }
}

// Отображение товаров на странице
function displayProducts(products) {
    if (!products || products.length === 0) {
        productsList.innerHTML = '<p class="empty">📭 Товаров пока нет. Добавьте первый товар!</p>';
        return;
    }
    
    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description || 'Без описания')}</p>
            
            <span class="category">${escapeHtml(product.category || 'Без категории')}</span>
            
            <div class="product-meta">
                <span class="price">${formatPrice(product.price)} ₽</span>
                <span class="quantity">${product.quantity} шт.</span>
            </div>
            
            ${product.expiry_date ? `
                <div class="expiry">
                    📅 Годен до: ${new Date(product.expiry_date).toLocaleDateString('ru-RU')}
                </div>
            ` : ''}
            
            <div class="product-id">
                <small>ID: ${product.id.substring(0, 8)}...</small>
            </div>
        </div>
    `).join('');
}

// Добавление нового товара
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addProductForm);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')) || 0,
        quantity: parseInt(formData.get('quantity')) || 1,
        category: formData.get('category'),
        expiry_date: formData.get('expiry_date') || null,
        created_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
        
        if (error) throw error;
        
        // Очищаем форму
        addProductForm.reset();
        
        // Обновляем список
        loadProducts();
        
        // Показываем уведомление
        showNotification('✅ Товар успешно добавлен!');
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        showNotification('❌ Ошибка при добавлении товара', 'error');
    }
});

// Вспомогательные функции
function formatPrice(price) {
    return parseFloat(price).toFixed(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#00b894' : '#d63031'};
        color: white;
        border-radius: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
        font-size: 1.2rem;
    }
    
    .error {
        color: #e74c3c;
        text-align: center;
        padding: 20px;
    }
    
    .expiry {
        margin-top: 10px;
        font-size: 0.9rem;
        color: #636e72;
    }
    
    .product-id {
        margin-top: 10px;
        font-size: 0.8rem;
        color: #b2bec3;
        text-align: right;
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    
    // Устанавливаем минимальную дату на сегодня
    const expiryDate = document.getElementById('expiry_date');
    const today = new Date().toISOString().split('T')[0];
    expiryDate.min = today;
});
