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
    const paymentOptionsButtons = document.querySelectorAll('.payment--options button');
    const inputFullName = document.getElementById('full_name');
    const inputPhoneNumber = document.getElementById('phone_number');
    const inputAddress = document.getElementById('address');
    const inputDeliveryTime = document.getElementById('delivery_time');

    let cart = []; 

    // --- Delivery Cost Variables ---
    const deliveryCostEgyptMadaeen = 25;
    const deliveryCostOtherLocations = 40;

    // --- Functions ---
    function addToCart(productId, productName, productPrice) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;

        const quantityInput = productCard.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value);
        if (isNaN(quantity) || quantity < 1) {
            alert('يرجى تحديد كمية صحيحة.');
            return;
        }

        // قراءة المقاس
        const sizeSelect = productCard.querySelector('.size-select');
        const selectedSize = sizeSelect ? sizeSelect.value : null;
        if (!selectedSize) {
            alert("من فضلك اختار المقاس");
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = quantity;
        } else {
            cart.push({ id: productId, name: productName, price: productPrice, quantity: quantity, size: selectedSize });
        }

        updateCartDisplay();
        alert(`تمت إضافة ${productName} (المقاس: ${selectedSize}, الكمية: ${quantity}) إلى السلة!`);
    }

    function updateQuantity(productId, change) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;

        const quantityInput = productCard.querySelector('.quantity-input');
        let currentQuantity = parseInt(quantityInput.value) || 1;
        const newQuantity = currentQuantity + change;

        if (newQuantity >= 1) {
            quantityInput.value = newQuantity;

            // تحديث الكمية لجميع العناصر بالمقاس المختار
            const sizeSelect = productCard.querySelector('.size-select');
            const selectedSize = sizeSelect ? sizeSelect.value : null;
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);
            if (itemIndex > -1) {
                cart[itemIndex].quantity = newQuantity;
                updateCartDisplay();
            }
        }
    }

    function removeItemFromCart(productId, size) {
        cart = cart.filter(item => !(item.id === productId && item.size === size));
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            const quantityInput = productCard.querySelector('.quantity-input');
            if (quantityInput) quantityInput.value = 1;
            const checkbox = productCard.querySelector('.input.add-to-cart');
            if (checkbox) checkbox.checked = false;
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
        resetDeliveryForm();
    }

    function resetDeliveryForm() {
        if (deliveryForm) deliveryForm.reset();
        paymentOptionsButtons.forEach(btn => btn.classList.remove('selected'));
    }

    function sendOrderViaWhatsApp() {
        if (cart.length === 0) {
            alert('عربة التسوق فارغة!');
            return;
        }

        let orderDetailsString = "";
        let totalOrderPrice = 0;

        cart.forEach(item => {
           orderDetailsString += `- ${item.name} | المقاس: ${item.size} | الكمية: ${item.quantity} | السعر: ${item.price.toFixed(2)} ج.م\n`;
           totalOrderPrice += item.price * item.quantity;
        });

        if (!inputFullName.value.trim() || !inputPhoneNumber.value.trim() || !inputAddress.value.trim()) {
            alert('يرجى ملء جميع حقول الاستلام الإلزامية (الاسم، الهاتف، العنوان).');
            return;
        }

        let currentDeliveryCost = 0;
        const lowerCaseAddress = inputAddress.value.trim().toLowerCase();
        if (lowerCaseAddress.includes('المعادي') || lowerCaseAddress.includes('حدائق المعادي') || lowerCaseAddress.includes('دار السلام')) {
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
تكلفة التوصيل: ${currentDeliveryCost} ج.م
الإجمالي النهائي: ${finalTotalPrice.toFixed(2)} ج.م
        `;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = '201017925907';
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappLink, '_blank');
        alert(`تم إرسال طلبك إلى واتساب لتأكيده. يرجى إكمال الخطوات هناك.\nتكلفة التوصيل: ${currentDeliveryCost} ج.م`);
    }

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let total = 0;
        let totalItems = 0;
        cart.sort((a, b) => a.id.localeCompare(b.id));

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<li>عربة التسوق فارغة.</li>`;
            cartTotalPrice.textContent = `0.00 ج.م`;
        } else {
            cart.forEach(item => {
                const listItem = document.createElement('li');
                const itemTotal = item.price * item.quantity;
                listItem.innerHTML = `
                    <span>${item.name} | المقاس: ${item.size}</span>
                    <span>${item.quantity} x ${item.price.toFixed(2)} ج.م</span>
                    <span>${itemTotal.toFixed(2)} ج.م</span>
                    <button class="remove-item-btn" data-id="${item.id}" data-size="${item.size}">إزالة</button>
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
            addToCartCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const productName = card.querySelector('.product-title').textContent;
                const productPrice = parseFloat(card.querySelector('.product-price').textContent.replace(/[^0-9.-]+/g, ""));
                const sizeSelect = card.querySelector('.size-select');
                const selectedSize = sizeSelect ? sizeSelect.value : null;

                if (productId && productName && !isNaN(productPrice)) {
                    if (isChecked) addToCart(productId, productName, productPrice);
                    else removeItemFromCart(productId, selectedSize);
                } else e.target.checked = !isChecked;
            });
        }
        if (minusBtn) minusBtn.addEventListener('click', () => updateQuantity(productId, -1));
        if (plusBtn) plusBtn.addEventListener('click', () => updateQuantity(productId, 1));
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productIdToRemove = e.target.dataset.id;
            const sizeToRemove = e.target.dataset.size;
            removeItemFromCart(productIdToRemove, sizeToRemove);
        }
    });

    if (paymentTriggerBtn) paymentTriggerBtn.addEventListener('click', showDeliveryForm);
    if (finalCheckoutBtn) finalCheckoutBtn.addEventListener('click', sendOrderViaWhatsApp);

    paymentOptionsButtons.forEach(button => {
        button.addEventListener('click', () => {
            paymentOptionsButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

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
                navLinks.classList.remove('active');
                menuIcon.classList.remove('active');
            });
        });
    }

    // --- Initial Setup ---
    updateCartDisplay();
});
