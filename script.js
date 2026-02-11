// Инициализация Supabase
const SUPABASE_URL = 'https://hocudyimgknwaitlsagk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vpdM56mSm1zukhIXNCPQkg_6vM9qxMH';

// Создание клиента Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM элементы
const medicineForm = document.getElementById('medicineForm');
const statusMessage = document.getElementById('statusMessage');
const dataList = document.getElementById('dataList');
const refreshBtn = document.getElementById('refreshBtn');

// Установка минимальной даты (сегодня) для срока годности
const expiryDateInput = document.getElementById('expiry_date');
const today = new Date().toISOString().split('T')[0];
expiryDateInput.min = today;
expiryDateInput.value = today;

// Функция для показа сообщений
function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'status-message error' : 'status-message success';
    
    // Автоматически скрыть сообщение через 5 секунд
    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Функция для получения всех записей из базы
async function fetchMedicines() {
    try {
        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayMedicines(data);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        showMessage(`Ошибка при получении данных: ${error.message}`, true);
    }
}

// Функция для отображения записей
function displayMedicines(medicines) {
    if (!medicines || medicines.length === 0) {
        dataList.innerHTML = '<p class="no-data">В базе данных пока нет записей.</p>';
        return;
    }

    const html = `
        <div class="medicine-item header">
            <div><strong>Название</strong></div>
            <div><strong>Категория</strong></div>
            <div><strong>Количество</strong></div>
            <div><strong>Срок годности</strong></div>
            <div><strong>Место хранения</strong></div>
        </div>
        ${medicines.map(medicine => `
            <div class="medicine-item">
                <div>${medicine.name || '-'}</div>
                <div>${medicine.category || '-'}</div>
                <div>${medicine.quantity || 1}</div>
                <div>${medicine.expiry_date ? formatDate(medicine.expiry_date) : '-'}</div>
                <div>${medicine.location || '-'}</div>
            </div>
        `).join('')}
    `;
    
    dataList.innerHTML = html;
}

// Функция для добавления новой записи
async function addMedicine(medicineData) {
    try {
        const { data, error } = await supabase
            .from('medicines')
            .insert([medicineData])
            .select();

        if (error) throw error;

        showMessage('✅ Запись успешно добавлена в базу данных!');
        medicineForm.reset();
        expiryDateInput.value = today; // Сбросить дату на сегодня
        
        // Обновить список
        fetchMedicines();
        
        return data;
    } catch (error) {
        console.error('Ошибка при добавлении:', error);
        showMessage(`❌ Ошибка: ${error.message}`, true);
        return null;
    }
}

// Обработчик отправки формы
medicineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(medicineForm);
    const medicineData = {
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: parseInt(formData.get('quantity')),
        expiry_date: formData.get('expiry_date'),
        location: formData.get('location'),
        created_at: new Date().toISOString()
    };

    await addMedicine(medicineData);
});

// Обработчик кнопки обновления
refreshBtn.addEventListener('click', () => {
    fetchMedicines();
    showMessage('📋 Список обновлен');
});

// Проверка подключения к Supabase при загрузке
async function checkConnection() {
    try {
        const { data, error } = await supabase
            .from('medicines')
            .select('count')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST301') {
                showMessage('⚠️ Таблица "medicines" не найдена. Создайте таблицу с помощью SQL-запроса выше.', true);
            } else {
                throw error;
            }
        } else {
            showMessage('✅ Подключение к Supabase успешно установлено!');
        }
    } catch (error) {
        console.error('Ошибка подключения:', error);
        showMessage(`❌ Ошибка подключения: ${error.message}`, true);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    fetchMedicines();
    
    // Тестовая запись для демонстрации
    setTimeout(() => {
        if (dataList.innerHTML.includes('no-data')) {
            showMessage('ℹ️ Добавьте первую запись через форму выше');
        }
    }, 1000);
});
