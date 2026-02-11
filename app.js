// Конфигурация Supabase
const SUPABASE_URL = 'https://hocudyimgknwaitlsagk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vpdM56mSm1zukhIXNCPQkg_6vM9qxMH';

// Инициализация клиента Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM элементы
const productsList = document.getElementById('products-list');
const addProductForm = document.getElementById('add-product-form');
const connectionStatus = document.getElementById('connection-status');

// Проверка подключения
async function checkConnection() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (error) throw error;
        
        connectionStatus.textContent = '✅ Подключено к Supabase';
        connectionStatus.className = 'status connected';
        console.log('✅ Подключение успешно');
        loadProducts();
    } catch (error) {
        console.error('❌ Ошибка подключения:', error);
        connectionStatus.textContent = `❌ Ошибка: ${error.message}`;
        connectionStatus.className = 'status error';
    }
}

// Загрузка товаров
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        productsList.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
}

// Отображение товаров
function displayProducts(products) {
    if (!products || products.length === 0) {
        productsList.innerHTML = '<div class="empty">📭 Товаров пока нет. Добавьте первый!</div>';
        return;
    }
    
    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-header">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <span class="category">${escapeHtml(product.category || 'Без категории')}</span>
            </div>
            <p class="product-description">${escapeHtml(product.description || 'Нет описания')}</p>
            <div class="product-details">
                <div class="detail">
                    <span class="label">Цена:</span>
                    <span class="price">${formatPrice(product.price)} ₽</span>
                </div>
                <div class="detail">
                    <span class="label">Количество:</span>
                    <span class="quantity">${product.quantity} шт.</span>
                </div>
                ${product.expiry_date ? `
                    <div class="detail">
                        <span class="label">Годен до:</span>
                        <span class="expiry">${new Date(product.expiry_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                ` : ''}
            </div>
            <div class="product-footer">
                <small>Добавлен: ${new Date(product.created_at).toLocaleDateString('ru-RU')}</small>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Добавление товара
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addProductForm);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')) || 0,
        quantity: parseInt(formData.get('quantity')) || 1,
        category: formData.get('category'),
        expiry_date: formData.get('expiry_date') || null
    };
    
    // Валидация
    if (!productData.name.trim()) {
        showNotification('❌ Введите название товара', 'error');
        return;
    }
    
    try {
        console.log('Отправка данных:', productData);
        
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
        
        if (error) {
            console.error('Supabase ошибка:', error);
            throw error;
        }
        
        console.log('Товар добавлен:', data);
        
        // Очищаем форму
        addProductForm.reset();
        
        // Обновляем список
        await loadProducts();
        
        // Уведомление
        showNotification('✅ Товар успешно добавлен!');
        
    } catch (error) {
        console.error('Ошибка добавления:', error);
        showNotification(`❌ Ошибка: ${error.message}`, 'error');
    }
});

// Удаление товара
async function deleteProduct(id) {
    if (!confirm('Удалить этот товар?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadProducts();
        showNotification('🗑️ Товар удален');
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showNotification(`❌ Ошибка удаления: ${error.message}`, 'error');
    }
}

// Вспомогательные функции
function formatPrice(price) {
    return parseFloat(price).toFixed(2);
}

function escapeHtml(text) {
    return text
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showNotification(message, type = 'success') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#00b894' : '#d63031'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем CSS для уведомлений и кнопки удаления
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
    
    .product-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
    }
    
    .product-details {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .detail {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    
    .label {
        color: #666;
    }
    
    .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        font-size: 0.9em;
        color: #888;
    }
    
    .btn-delete {
        background: #ff7675;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.3s;
    }
    
    .btn-delete:hover {
        background: #d63031;
        transform: scale(1.1);
    }
    
    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #7f8c8d;
        font-size: 1.2rem;
        background: #f8f9fa;
        border-radius: 15px;
        border: 2px dashed #dfe6e9;
    }
    
    .error {
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        color: #e74c3c;
        background: #ffeaea;
        border-radius: 10px;
        border: 1px solid #ffcccc;
    }
`;
document.head.appendChild(style);

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    
    // Устанавливаем минимальную дату на сегодня
    const expiryDate = document.getElementById('expiry_date');
    const today = new Date().toISOString().split('T')[0];
    expiryDate.min = today;
    
    // Тестовый вызов
    console.log('Supabase клиент инициализирован:', !!supabase);
});
