document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const cartButton = document.getElementById('cart-button'); 
    const floatingCartButton = document.getElementById('floating-cart-button'); 
    const cartModal = document.getElementById('cart-modal');
    const closeModalButton = document.getElementById('close-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartItemCountFloating = floatingCartButton ? floatingCartButton.querySelector('.cart-item-count-svg') : null;
    const paymentTriggerBtn = document.querySelector('.payment-trigger-btn');
    const finalCheckoutBtn = document.getElementById('final-checkout-btn');

    // Delivery Form Elements
    const deliveryForm = document.getElementById('delivery-form');
    const paymentFormContainer = document.querySelector('.payment-form-container');
    const cartItemsSection = document.getElementById('cart-items-section');
    // const paymentOptionsButtons = document.querySelectorAll('.payment--options button'); // تم إزالتها لعدم وجودها في HTML
    const inputFullName = document.getElementById('full_name');
    const inputPhoneNumber = document.getElementById('phone_number');
    const inputAddress = document.getElementById('address');
    const inputDeliveryTime = document.getElementById('delivery_time');

    let cart = []; // Array to hold cart items

    // --- Delivery Cost Variables ---
    const deliveryCostEgyptMadaeen = 25;
    const deliveryCostOtherLocations = 40;

    // --- Helper Functions ---
    
    /**
     * يحصل على المقاس المختار حالياً من داخل كرت المنتج.
     * تم تعديل هذه الدالة للبحث عن زر Radio Button المختار.
     */
    function getSelectedSize(productCard) {
        const sizeRadios = productCard.querySelectorAll('.sizes input[type="radio"]');
        let selectedSize = null;
        sizeRadios.forEach(radio => {
            if (radio.checked) {
                selectedSize = radio.value;
            }
        });
        return selectedSize;
    }

    /**
     * يجد عنصر التحقق (checkbox) المقابل للمنتج والمقاس المختار
     */
    function getCheckboxByProductAndSize(productId, size) {
        // بما أن كود HTML لا يدعم ربط checkbox بمقاس معين بشكل مباشر، سنعتمد على productId فقط
        // وهذا قد يسبب مشاكل في حالة تعدد المقاسات في نفس السلة لنفس المنتج
        // (لكن مع التصميم الحالي لزر الإضافة للسلة، يجب أن يُستخدم checkbox واحد لكل منتج)
        return document.querySelector(`.product-card[data-id="${productId}"] .input.add-to-cart`);
    }

    // --- Main Cart Functions ---
    
    function addToCart(productId, productName, productPrice, isChecked) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;

        const quantityInput = productCard.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value) || 1;
        
        // **الإصلاح الرئيسي 1: استخدام getSelectedSize بدلاً من sizeSelect**
        const selectedSize = getSelectedSize(productCard);

        if (!selectedSize && isChecked) {
            // تنبيه المستخدم إذا حاول الإضافة دون اختيار مقاس (فقط إذا كان يحاول الإضافة - isChecked)
            alert("من فضلك اختار المقاس أولاً.");
            const checkbox = productCard.querySelector('.input.add-to-cart');
            if (checkbox) checkbox.checked = false; // إلغاء تحديد الـ checkbox
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);
        
        if (isChecked) {
            // منطق الإضافة/التحديث
            if (existingItemIndex > -1) {
                // إذا كان موجوداً، قم بتحديث الكمية (حسب قيمة حقل الكمية في البطاقة)
                cart[existingItemIndex].quantity = quantity;
            } else {
                // إذا لم يكن موجوداً، قم بالإضافة
                cart.push({ id: productId, name: productName, price: productPrice, quantity: quantity, size: selectedSize });
                // alert(`تمت إضافة ${productName} (المقاس: ${selectedSize}, الكمية: ${quantity}) إلى السلة!`); // إزالة التنبيه المتكرر
            }
        } else {
            // منطق الإزالة (هذا يجب أن يتم عبر دالة removeItemFromCart)
            if (existingItemIndex > -1) {
                 removeItemFromCart(productId, selectedSize, false); // يتم التحديث داخل الدالة
            }
        }

        updateCartDisplay();
    }

    function updateQuantity(productId, change) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;

        const quantityInput = productCard.querySelector('.quantity-input');
        let currentQuantity = parseInt(quantityInput.value) || 1;
        const newQuantity = currentQuantity + change;

        if (newQuantity >= 1) {
            quantityInput.value = newQuantity;

            // **الإصلاح الرئيسي 2: تحديث كمية المنتج في السلة بناءً على المقاس المختار**
            const selectedSize = getSelectedSize(productCard);
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);
            
            // تحديث الكمية في السلة فقط إذا كان المنتج والمقاس محددين وموجودين في السلة
            if (itemIndex > -1) {
                cart[itemIndex].quantity = newQuantity;
                updateCartDisplay();
            }
        }
    }

    function removeItemFromCart(productId, size, updateCheckbox = true) {
        // إزالة العنصر من مصفوفة السلة
        cart = cart.filter(item => !(item.id === productId && item.size === size));
        
        // **الإصلاح الرئيسي 3: إعادة تعيين حالة الـ checkbox على المنتج**
        if (updateCheckbox) {
            const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (productCard) {
                const checkbox = productCard.querySelector('.input.add-to-cart');
                if (checkbox) checkbox.checked = false;

                // إعادة تعيين الكمية في حقل الإدخال إلى 1
                const quantityInput = productCard.querySelector('.quantity-input');
                if (quantityInput) quantityInput.value = 1;

                // **اختياري:** إعادة تعيين اختيار المقاس في البطاقة بعد الإزالة
                const sizeRadios = productCard.querySelectorAll('.sizes input[type="radio"]');
                sizeRadios.forEach(radio => radio.checked = false);
            }
        }
        
        updateCartDisplay();
    }

    function openCartModal() {
        if (cartModal) {
            cartModal.style.display = 'block';
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
            updateCartDisplay();
        }
    }

    function closeCartModal() {
        if (cartModal) {
            cartModal.style.display = 'none';
            resetDeliveryForm();
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
        }
    }

    function showDeliveryForm() {
        if (cart.length === 0) {
            alert('عربة التسوق فارغة!');
            return;
        }
        if(cartItemsSection) cartItemsSection.style.display = 'none';
        if(paymentFormContainer) paymentFormContainer.style.display = 'block';
        // لا حاجة لـ resetDeliveryForm هنا
    }

    function resetDeliveryForm() {
        if (deliveryForm) deliveryForm.reset();
        // paymentOptionsButtons.forEach(btn => btn.classList.remove('selected')); // تم إزالتها
    }

    function sendOrderViaWhatsApp(e) {
        e.preventDefault(); // منع الإرسال التقليدي للنموذج

        if (cart.length === 0) {
            alert('عربة التسوق فارغة!');
            return;
        }
        
        // التحقق من الحقول الإلزامية
        if (!inputFullName.value.trim() || !inputPhoneNumber.value.trim() || !inputAddress.value.trim()) {
            alert('يرجى ملء جميع حقول الاستلام الإلزامية (الاسم، الهاتف، العنوان).');
            return;
        }

        let orderDetailsString = "";
        let totalOrderPrice = 0;

        cart.forEach(item => {
           orderDetailsString += `- ${item.name} | المقاس: ${item.size} | الكمية: ${item.quantity} | السعر: ${item.price.toFixed(2)} ج.م\n`;
           totalOrderPrice += item.price * item.quantity;
        });

        let currentDeliveryCost = 0;
        const lowerCaseAddress = inputAddress.value.trim().toLowerCase();
        // **الإصلاح 4: إضافة مدن ومناطق أخرى شهيرة في نطاق التوصيل الرخيص**
        const madaeenKeywords = ['المعادي', 'حدائق المعادي', 'دار السلام', 'دارالسلام', 'حلوان', 'طره', 'البساتين', 'المقطم'];
        const isMadaeenArea = madaeenKeywords.some(keyword => lowerCaseAddress.includes(keyword));

        if (isMadaeenArea) {
            currentDeliveryCost = deliveryCostEgyptMadaeen;
        } else {
            currentDeliveryCost = deliveryCostOtherLocations;
        }

        const finalTotalPrice = totalOrderPrice + currentDeliveryCost;

        const whatsappMessage = `
--- تفاصيل طلب جديد ---
اسم العميل: ${inputFullName.value.trim()}
رقم الهاتف: ${inputPhoneNumber.value.trim()}
العنوان: ${inputAddress.value.trim()}
وقت التسليم المفضل: ${inputDeliveryTime.value.trim() || 'غير محدد'}
--------------------
المنتجات المطلوبة:
${orderDetailsString}
--------------------
مجموع أسعار المنتجات: ${totalOrderPrice.toFixed(2)} ج.م
تكلفة التوصيل: ${currentDeliveryCost} ج.م
الإجمالي النهائي: ${finalTotalPrice.toFixed(2)} ج.م
        `;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = '201017925907'; // رقم الواتساب الخاص بك
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // فتح رابط الواتساب
        window.open(whatsappLink, '_blank');
        
        // إغلاق المودال بعد الإرسال
        closeCartModal();
        
        // **اختياري:** تفريغ السلة بعد إتمام الطلب (يفضل بعد تأكيد العميل على الواتساب، ولكن لتنظيف الواجهة الآن)
        // cart = [];
        // updateCartDisplay();
        // resetAllProductCards(); // دالة جديدة لإعادة تعيين جميع البطاقات
    }

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let total = 0;
        let totalItems = 0;
        cart.sort((a, b) => a.id.localeCompare(b.id) || a.size.localeCompare(b.size)); // ترتيب حسب المنتج ثم المقاس

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<li style="text-align: center; color: var(--light-text-color);">عربة التسوق فارغة.</li>`;
            cartTotalPrice.textContent = `0.00 ج.م`;
        } else {
            cart.forEach(item => {
                const listItem = document.createElement('li');
                const itemTotal = item.price * item.quantity;
                listItem.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
                        <strong>${item.name}</strong> 
                        <span>المقاس: ${item.size} | الكمية: ${item.quantity}</span>
                    </div>
                    <div style="text-align: left; color: #38a169;">
                        ${itemTotal.toFixed(2)} ج.م
                    </div>
                    <button class="remove-item-btn btn" data-id="${item.id}" data-size="${item.size}" style="background-color: #f44336; color: white; padding: 5px 10px; font-size: 0.9rem;">إزالة</button>
                `;
                cartItemsList.appendChild(listItem);
                total += itemTotal;
                totalItems += item.quantity;
            });
            cartTotalPrice.textContent = `${total.toFixed(2)} ج.م`;
        }

        if (cartItemCountFloating) {
            if (totalItems > 0) {
                cartItemCountFloating.textContent = totalItems;
                cartItemCountFloating.style.display = 'flex';
            } else {
                cartItemCountFloating.style.display = 'none';
            }
        }
    }

    // --- Event Listeners ---
    if (cartButton) cartButton.addEventListener('click', openCartModal);
    if (floatingCartButton) floatingCartButton.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
    if (closeModalButton) closeModalButton.addEventListener('click', closeCartModal);
    if (cartModal) window.addEventListener('click', (event) => { if (event.target === cartModal) closeCartModal(); });

    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.id;
        const addToCartCheckbox = card.querySelector('.input.add-to-cart'); 
        const minusBtn = card.querySelector('.minus-btn');
        const plusBtn = card.querySelector('.plus-btn');

        if (addToCartCheckbox) {
            // **الإصلاح 5: تمرير حالة الـ checkbox إلى addToCart**
            addToCartCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const productName = card.querySelector('.product-title').textContent;
                const productPriceText = card.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                const productPrice = parseFloat(productPriceText);

                if (productId && productName && !isNaN(productPrice)) {
                    // دالة addToCart ستتحقق من المقاس وتنفذ الإضافة أو تلغي التحديد
                    addToCart(productId, productName, productPrice, isChecked);
                } else {
                    e.target.checked = !isChecked; // إرجاع الحالة إذا كانت البيانات غير سليمة
                }
            });
        }
        
        // **الإصلاح 6: عند تغيير الكمية، لا نحتاج لتغيير حالة الـ checkbox**
        if (minusBtn) minusBtn.addEventListener('click', () => updateQuantity(productId, -1));
        if (plusBtn) plusBtn.addEventListener('click', () => updateQuantity(productId, 1));
        
        // **الإصلاح 7: إضافة مستمعي حدث لأزرار المقاسات**
        card.querySelectorAll('.sizes input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // إذا تم تحديد مقاس جديد، وتحقق الـ checkbox بالفعل (أي المنتج في السلة)
                if (addToCartCheckbox.checked) {
                    const productName = card.querySelector('.product-title').textContent;
                    const productPriceText = card.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                    const productPrice = parseFloat(productPriceText);
                    
                    // تحديث الكمية في السلة للعنصر الجديد (بالمقاس الجديد)
                    // بما أننا لا نعرف ما إذا كان المقاس السابق موجوداً في السلة، نعتمد على المنطق داخل addToCart
                    addToCart(productId, productName, productPrice, true);
                }
            });
        });
    });
    
    // **الإصلاح 8: إزالة العنصر من السلة داخل المودال**
    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productIdToRemove = e.target.dataset.id;
            const sizeToRemove = e.target.dataset.size;
            removeItemFromCart(productIdToRemove, sizeToRemove);
        }
    });

    if (paymentTriggerBtn) paymentTriggerBtn.addEventListener('click', showDeliveryForm);
    // **الإصلاح 9: استخدام addEventListener بشكل صحيح مع finalCheckoutBtn**
    if (finalCheckoutBtn) finalCheckoutBtn.addEventListener('click', sendOrderViaWhatsApp);

    // --- Mobile Menu Toggle ---
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');
    if (menuIcon && navLinks) {
        menuIcon.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuIcon.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // تأخير بسيط لضمان تنفيذ الانتقال قبل إخفاء القائمة
                setTimeout(() => {
                    navLinks.classList.remove('active');
                    menuIcon.classList.remove('active');
                }, 150);
            });
        });
    }

    // --- Initial Setup ---
    updateCartDisplay();
});
